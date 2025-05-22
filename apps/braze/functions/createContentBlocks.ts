import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { type PlainClientAPI, createClient } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

type AppInstallationParameters = {
  brazeApiKey: string;
  brazeEndpoint: string;
};

export type AppActionParameters = {
  entryId: string;
  fieldIds: string;
  contentBlockNames: string;
  contentBlockDescriptions: string;
};

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

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppActionParameters
> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);

  const { entryId, fieldIds, contentBlockNames, contentBlockDescriptions } = event.body;
  const parsedContentBlockNames = JSON.parse(contentBlockNames) as Record<string, string>;
  const parsedContentBlockDescriptions = JSON.parse(contentBlockDescriptions) as Record<
    string,
    string
  >;
  const entry = await cma.entry.get({ entryId });
  const contentType = await cma.contentType.get({
    contentTypeId: entry.sys.contentType.sys.id,
  });
  const locale = entry.sys.locale || 'en-US'; // TODO: define what to do here

  const fieldIdArray = fieldIds.split(',').map((id) => id.trim());

  const { brazeApiKey, brazeEndpoint } =
    context.appInstallationParameters as AppInstallationParameters;

  if (!brazeApiKey || !brazeEndpoint) {
    throw new Error('Braze API key or endpoint not configured');
  }

  const results = [];

  for (const fieldId of fieldIdArray) {
    const fieldValue = entry.fields[fieldId]?.[locale];

    if (!fieldValue) {
      results.push({
        fieldId,
        success: false,
        statusCode: 600,
        message: `Field ${fieldId} does not exist or is empty`,
      });
      continue;
    }

    if (!parsedContentBlockNames[fieldId]) {
      results.push({
        fieldId,
        success: false,
        statusCode: 400,
        message: `Unexpected error: Content block name not found for field ${fieldId}`,
      });
      continue;
    }

    try {
      const field = contentType.fields.find((f) => f.id === fieldId);
      let content = fieldValue;

      if (field?.type === 'RichText') {
        content = documentToHtmlString(fieldValue);
      }

      const response = await fetch(`${brazeEndpoint}/content_blocks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${brazeApiKey}`,
        },
        body: JSON.stringify({
          name: parsedContentBlockNames[fieldId],
          content: content,
          state: 'draft',
          description: parsedContentBlockDescriptions[fieldId] || '',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        results.push({
          fieldId,
          success: false,
          statusCode: response.status,
          message: `Error creating content block for field ${fieldId}: ${data.message}`,
        });
        continue;
      }

      results.push({
        fieldId,
        success: true,
        statusCode: 201,
        contentBlockId: data.content_block_id,
      });
    } catch (error) {
      results.push({
        fieldId,
        success: false,
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    results,
  };
};
