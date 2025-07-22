import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { AppInstallationParameters } from '../src/utils';
import { initContentfulManagementClient, stringifyFieldValue } from './common';
import { ContentTypeProps, EntryProps, ContentFields } from 'contentful-management';
import { KeyValueMap } from 'contentful-management';

export type AppActionParameters = {
  entryId: string;
  fieldsData: string;
};

type FieldData = {
  fieldId: string;
  locale?: string;
  contentBlockName: string;
  contentBlockDescription: string;
};

const createBrazeErrorMessage = (
  fieldId: string,
  locale: string | undefined,
  errorMessage: string
): string => {
  const fieldIdentifier = `field ${fieldId}` + (locale ? ` and locale ${locale}` : '');
  return `Error creating content block for ${fieldIdentifier}: ${errorMessage}`;
};

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppActionCall,
  AppActionParameters
> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const cma = initContentfulManagementClient(context);

  const { entryId, fieldsData } = event.body;
  const parsedFieldData = JSON.parse(fieldsData);
  const entry = await cma.entry.get({ entryId });
  const contentType = await cma.contentType.get({
    contentTypeId: entry.sys.contentType.sys.id,
  });

  const { brazeApiKey, brazeEndpoint } =
    context.appInstallationParameters as AppInstallationParameters;

  if (!brazeApiKey || !brazeEndpoint) {
    throw new Error('Braze API key or endpoint not configured');
  }

  const results = [];

  for (const fieldData of parsedFieldData) {
    results.push(
      await createContentBlock(entry, fieldData, contentType, brazeApiKey, brazeEndpoint)
    );
  }

  return {
    results,
  };
};

const createContentBlock = async (
  entry: EntryProps<KeyValueMap>,
  fieldData: FieldData,
  contentType: ContentTypeProps,
  brazeApiKey: string,
  brazeEndpoint: string
) => {
  const { fieldId, locale, contentBlockName, contentBlockDescription } = fieldData;
  if (!fieldId || !contentBlockName) {
    return {
      fieldId: fieldId || '',
      success: false,
      statusCode: 601,
      message: `Unexpected error: Information missing. Field ID: ${fieldId} - Content block name: ${contentBlockName}`,
    };
  }

  let fieldValue;
  if (entry.fields[fieldId]) {
    fieldValue = locale ? entry.fields[fieldId][locale] : Object.values(entry.fields[fieldId])[0];
  }

  if (!fieldValue) {
    return {
      fieldId,
      ...(locale ? { locale } : {}),
      success: false,
      statusCode: 600,
      message: `Field ${fieldId}` + (locale ? ` with locale ${locale}` : '') + ' is empty',
    };
  }

  try {
    const field = contentType.fields.find((f) => f.id === fieldId);
    if (!field) {
      return {
        fieldId,
        ...(locale ? { locale } : {}),
        success: false,
        statusCode: 602,
        message: `Field ${fieldId} not found in content type`,
      };
    }

    const content = stringifyFieldValue(fieldValue, field);

    const response = await fetch(`${brazeEndpoint}/content_blocks/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brazeApiKey}`,
      },
      body: JSON.stringify({
        name: contentBlockName,
        content: content,
        state: 'draft',
        description: contentBlockDescription || '',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        return {
          fieldId,
          ...(locale ? { locale } : {}),
          success: false,
          statusCode: response.status,
          message: createBrazeErrorMessage(fieldId, locale, 'Invalid API Key or Braze Endpoint'),
        };
      } else {
        return {
          fieldId,
          ...(locale ? { locale } : {}),
          success: false,
          statusCode: response.status,
          message: createBrazeErrorMessage(fieldId, locale, data.message),
        };
      }
    }

    return {
      fieldId,
      ...(locale ? { locale } : {}),
      success: true,
      statusCode: 201,
      contentBlockId: data.content_block_id,
    };
  } catch (error) {
    return {
      fieldId,
      ...(locale ? { locale } : {}),
      success: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
