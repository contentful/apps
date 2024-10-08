import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  AppEventEntry,
  AppEventRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import type { EntryProps, PlainClientAPI, Link } from 'contentful-management';
import { buildAutotagPrompts } from './prompts';

const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

async function fetchOpenAiResponse(
  entry: EntryProps,
  apiKey: string,
  apiUrl: string,
  model: string
): Promise<string[]> {
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildAutotagPrompts(entry),
      }),
    });
    if (!response.ok) {
      console.error('Failed to fetch OpenAI response:', response.statusText);
      return [];
    }
    const data = await response.json();
    return data.choices[0].message.content.split(',');
  } catch (error) {
    console.error('Error fetching OpenAI response:', error);
    return [];
  }
}

async function getExistingTags(cma: PlainClientAPI): Promise<string[]> {
  try {
    const tags = await cma.tag.getMany({});
    return tags.items.map((tag) => tag.name);
  } catch (error) {
    console.error('Error fetching existing tags from Contentful:', error);
    throw error;
  }
}

async function createNewTags(cma: PlainClientAPI, newTags: string[]): Promise<void> {
  try {
    await Promise.all(
      newTags.map((tag) =>
        cma.tag.createWithId(
          { tagId: tag },
          {
            name: tag,
            sys: {
              visibility: 'private',
            },
          }
        )
      )
    );
  } catch (error) {
    console.error('Error creating new tags in Contentful:', error);
    throw error;
  }
}

async function updateEntryTags(
  cma: PlainClientAPI,
  entry: EntryProps,
  tags: Link<'Tag'>[]
): Promise<void> {
  try {
    await cma.entry.patch(
      { entryId: entry.sys.id },
      [
        {
          op: 'replace',
          path: '/metadata/tags',
          value: tags,
        },
      ],
      {
        'X-Contentful-Version': entry.sys.version,
      }
    );
  } catch (error) {
    console.error('Error updating entry tags in Contentful:', error);
    throw error;
  }
}

async function autotag(
  entry: EntryProps,
  cma: PlainClientAPI,
  appInstallationParameters: Record<string, any>
) {
  const apiKey = appInstallationParameters.apiKey || '';
  const apiUrl = appInstallationParameters.apiUrl || DEFAULT_API_URL;
  const model = appInstallationParameters.model || DEFAULT_MODEL;
  try {
    const existingTags = await getExistingTags(cma);
    const suggestedTags = await fetchOpenAiResponse(entry, apiKey, apiUrl, model);
    const newTags = suggestedTags.filter((tag) => !existingTags.includes(tag));
    await createNewTags(cma, newTags);
    const entryTags = entry.metadata?.tags || [];
    entryTags.push(
      ...suggestedTags.map(
        (tag) => ({ sys: { id: tag, linkType: 'Tag', type: 'Link' } } as Link<'Tag'>)
      )
    );
    await updateEntryTags(cma, entry, entryTags);
    console.log(`Autotagged ${entry.sys.id} with ${newTags.join(', ')} ✨`);
  } catch (error) {
    console.error('Error autotagging entry:', error);
  }
}

const appActionHandler: EventHandler<'appaction.call'> = async (
  event: AppActionRequest<'Custom' | 'Entries.v1.0' | 'Notification.v1.0'>,
  context: FunctionEventContext
) => {
  const {
    body: { entryId },
  } = event as AppActionRequest<'Custom', { entryId: string }>;
  const { cma, appInstallationParameters } = context as FunctionEventContext & {
    cma: PlainClientAPI;
  };
  try {
    const entry = await cma.entry.get({ entryId });
    await autotag(entry, cma, appInstallationParameters);
    return { success: true };
  } catch (error) {
    console.error('Error handling action:', error);
    return { success: false };
  }
};

const appEventHandler: EventHandler<'appevent.handler'> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const { cma, appInstallationParameters } = context as FunctionEventContext & {
    cma: PlainClientAPI;
  };
  try {
    const { body: entry } = event as AppEventEntry;
    await autotag(entry, cma, appInstallationParameters);
  } catch (error) {
    console.error('Error handling event:', error);
  }
};

export const handler: EventHandler<'appaction.call' | 'appevent.handler'> = async (
  event: AppActionRequest | AppEventRequest,
  context: FunctionEventContext
) => {
  if (event.type === 'appaction.call') {
    return appActionHandler(event, context);
  } else if (event.type === 'appevent.handler') {
    return appEventHandler(event, context);
  } else {
    throw new Error(`Unsupported event type ${event.type}`);
  }
};
