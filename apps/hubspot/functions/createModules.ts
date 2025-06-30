import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import {
  DATE_FIELD_TEMPLATE,
  DATE_MODULE_TEMPLATE,
  DATETIME_FIELD_TEMPLATE,
  DATETIME_MODULE_TEMPLATE,
  IMAGE_FIELD_TEMPLATE,
  IMAGE_MODULE_TEMPLATE,
  META_JSON_TEMPLATE,
  NUMBER_FIELD_TEMPLATE,
  NUMBER_MODULE_TEMPLATE,
  RICH_TEXT_FIELD_TEMPLATE,
  RICH_TEXT_MODULE_TEMPLATE,
  TEXT_FIELD_TEMPLATE,
  TEXT_MODULE_TEMPLATE,
} from './templates';
import { SdkField } from '../src/utils/utils';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

type AppActionParameters = {
  entryTitle: string;
  fields: string;
};

/**
 * This handler is invoked when your App Action is called
 *
 * @param event - Contains the parameters passed to your App Action
 * @param context - Provides access to the CMA client and other context information
 */
export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  const success = [];
  const failed = [];
  const entryTitle = event.body.entryTitle;
  for (const field of JSON.parse(event.body.fields)) {
    try {
      await createModule(field, context.appInstallationParameters.hubspotAccessToken, entryTitle);
      success.push(field);
    } catch (error) {
      failed.push(field);
    }
  }
  return {
    success,
    failed,
  };
};

const createModule = async (field: SdkField, token: string, entryTitle: string) => {
  const fields = getFields(field);
  const module = getModule(field);
  const moduleName = `${entryTitle}-${field.uniqueId}`;
  await createModuleFile(JSON.stringify(META_JSON_TEMPLATE), 'meta.json', moduleName, token);
  await createModuleFile(fields, 'fields.json', moduleName, token);
  await createModuleFile(module, 'module.html', moduleName, token);
};

const createModuleFile = async (
  file: string,
  fileName: string,
  moduleName: string,
  token: string
) => {
  const fileBuffer = Buffer.from(file);
  const url = `https://api.hubapi.com/cms/v3/source-code/published/content/${moduleName}.module/${fileName}`;
  const formData = new FormData();
  const type = fileName.endsWith('json') ? 'application/json' : 'text/html';
  formData.append('file', new Blob([fileBuffer], { type: type }), fileName);

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(
      `HubSpot API request failed: ${response.status} ${response.statusText} - ${errorData}`
    );
  }
};

const getFields = (field: SdkField): string => {
  const { type } = field;
  let fields;
  switch (type) {
    case 'Symbol':
      fields = structuredClone(TEXT_FIELD_TEMPLATE);
      if (field.value) fields[0].default = field.value;
      break;
    case 'RichText':
      fields = structuredClone(RICH_TEXT_FIELD_TEMPLATE);
      if (field.value) fields[0].default = documentToHtmlString(field.value);
      break;
    case 'Number':
    case 'Integer':
      fields = structuredClone(NUMBER_FIELD_TEMPLATE);
      if (field.value) fields[0].default = field.value;
      break;
    case 'Date':
      const value = field.value as string;
      if (!value) {
        fields = structuredClone(DATETIME_FIELD_TEMPLATE);
      } else if (value.includes('T')) {
        fields = structuredClone(DATETIME_FIELD_TEMPLATE);
        fields[0].default = new Date(value).getTime();
      } else {
        fields = structuredClone(DATE_FIELD_TEMPLATE);
        fields[0].default = new Date(value).getTime();
      }
      break;
    case 'Location':
      fields = structuredClone(TEXT_FIELD_TEMPLATE);
      if (field.value) fields[0].default = `lat:${field.value.lat}, long:${field.value.lon}`;
      break;
    case 'Array':
      fields = structuredClone(TEXT_FIELD_TEMPLATE);
      if (field.value) fields[0].default = field.value.join(', ');
      break;
    case 'Link':
      fields = structuredClone(IMAGE_FIELD_TEMPLATE);
      if (field.value) {
        fields[0].default.src = field.value.url;
        fields[0].default.width = field.value.width;
        fields[0].default.height = field.value.height;
      }
      break;
    default:
      fields = structuredClone(TEXT_FIELD_TEMPLATE);
      if (field.value) fields[0].default = field.value;
      break;
  }
  return JSON.stringify(fields);
};

const getModule = (field: SdkField): string => {
  const { type } = field;
  switch (type) {
    case 'Symbol':
      return TEXT_MODULE_TEMPLATE;
    case 'RichText':
      return RICH_TEXT_MODULE_TEMPLATE;
    case 'Number':
    case 'Integer':
      return NUMBER_MODULE_TEMPLATE;
    case 'Date':
      const value = field.value as string;
      if (value.includes('T')) {
        return DATETIME_MODULE_TEMPLATE;
      } else {
        return DATE_MODULE_TEMPLATE;
      }
    case 'Location':
      return TEXT_MODULE_TEMPLATE;
    case 'Link':
      return IMAGE_MODULE_TEMPLATE;
    case 'Array':
      return TEXT_MODULE_TEMPLATE;
    default:
      return TEXT_MODULE_TEMPLATE;
  }
};
