import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import {
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

export const handler: EventHandler<'appevent.handler'> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  const { cma, appInstallationParameters } = context as FunctionEventContext & {
    cma: PlainClientAPI;
  };
  const apiKey = appInstallationParameters.apiKey || '';
  const apiUrl = appInstallationParameters.apiUrl || DEFAULT_API_URL;
  const model = appInstallationParameters.model || DEFAULT_MODEL;
  const { body } = event as AppEventEntry;
  try {
    const existingTags = await getExistingTags(cma);
    const suggestedTags = await fetchOpenAiResponse(body, apiKey, apiUrl, model);
    const newTags = suggestedTags.filter((tag) => !existingTags.includes(tag));
    await createNewTags(cma, newTags);
    const entryTags = body.metadata?.tags || [];
    entryTags.push(
      ...suggestedTags.map(
        (tag) => ({ sys: { id: tag, linkType: 'Tag', type: 'Link' } } as Link<'Tag'>)
      )
    );
    await updateEntryTags(cma, body, entryTags);
    console.log(`Autotagged ${body.sys.id} with ${newTags.join(', ')} ✨`);
  } catch (error) {
    console.error('Error handling event:', error);
  }
};
