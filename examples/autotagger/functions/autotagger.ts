import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  AppEventEntry,
  AppEventRequest,
  EntryAutosaveEventPayload,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import {
  type EntryProps,
  type PlainClientAPI,
  type Link,
  createClient,
} from 'contentful-management';
import { buildAutotagPrompts } from './prompts';

const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error(
      'Contentful Management API client options are only provided for certain function types. To learn more about using the CMA within functions, see https://www.contentful.com/developers/docs/extensibility/app-framework/functions/#using-the-cma.'
    );
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

async function fetchOpenAiResponse(
  entry: EntryAutosaveEventPayload | EntryProps,
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
    return tags.items.map((tag) => tag.sys.id);
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
          { tagId: tag.trim() },
          {
            name: tag.trim(),
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
  entry: EntryAutosaveEventPayload | EntryProps,
  tags: Link<'Tag'>[]
): Promise<void> {
  try {
    await cma.entry.patch(
      { entryId: entry.sys.id, version: entry.sys.version },
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
  entry: EntryAutosaveEventPayload | EntryProps,
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

const appActionHandler: EventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', { entryId: string }>,
  context: FunctionEventContext
) => {
  const {
    body: { entryId },
  } = event;
  try {
    const cma = initContentfulManagementClient(context);
    const entry = await cma.entry.get({ entryId });
    await autotag(entry, cma, context.appInstallationParameters);
    return { success: true };
  } catch (error) {
    console.error('Error handling action:', error);
    return { success: false };
  }
};

const appEventHandler: EventHandler<FunctionTypeEnum.AppEventHandler> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  try {
    const cma = initContentfulManagementClient(context);
    const { body: entry } = event as AppEventEntry;
    await autotag(entry as EntryAutosaveEventPayload, cma, context.appInstallationParameters);
  } catch (error) {
    console.error('Error handling event:', error);
  }
};

export const handler: EventHandler<
  FunctionTypeEnum.AppActionCall | FunctionTypeEnum.AppEventHandler
> = async (event, context) => {
  if (event.type === 'appaction.call') {
    return appActionHandler(event, context);
  } else if (event.type === 'appevent.handler') {
    return appEventHandler(event, context);
  } else {
    throw new Error(`Unsupported event type ${event.type}`);
  }
};
