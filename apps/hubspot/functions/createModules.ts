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
import { SelectedSdkField } from '../src/utils/fieldsProcessing';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

type AppActionParameters = {
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
  for (const field of JSON.parse(event.body.fields)) {
    try {
      await createModule(field, context.appInstallationParameters.hubspotAccessToken);
      success.push(field.uniqueId);
    } catch (error) {
      failed.push(field.uniqueId);
    }
  }
  return {
    success,
    failed,
  };
};

const createModule = async (field: SelectedSdkField, token: string) => {
  const { fieldsFile, moduleFile } = getFiles(field);
  const moduleName = field.moduleName;
  await createModuleFile(JSON.stringify(META_JSON_TEMPLATE), 'meta.json', moduleName, token);
  await createModuleFile(fieldsFile, 'fields.json', moduleName, token);
  await createModuleFile(moduleFile, 'module.html', moduleName, token);
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

const getFiles = (field: SelectedSdkField): { fieldsFile: string; moduleFile: string } => {
  const { type } = field;
  let fieldsFile;
  let moduleFile;
  switch (type) {
    case 'Symbol':
    case 'Text':
      fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      if (field.value) fieldsFile[0].default = field.value;
      moduleFile = TEXT_MODULE_TEMPLATE;
      break;
    case 'RichText':
      fieldsFile = structuredClone(RICH_TEXT_FIELD_TEMPLATE);
      if (field.value) fieldsFile[0].default = documentToHtmlString(field.value);
      moduleFile = RICH_TEXT_MODULE_TEMPLATE;
      break;
    case 'Number':
    case 'Integer':
      fieldsFile = structuredClone(NUMBER_FIELD_TEMPLATE);
      if (field.value) fieldsFile[0].default = field.value;
      moduleFile = NUMBER_MODULE_TEMPLATE;
      break;
    case 'Date':
      const value = field.value as string;
      if (!value || value.includes('T')) {
        fieldsFile = structuredClone(DATETIME_FIELD_TEMPLATE);
        moduleFile = DATETIME_MODULE_TEMPLATE;
      } else {
        fieldsFile = structuredClone(DATE_FIELD_TEMPLATE);
        moduleFile = DATE_MODULE_TEMPLATE;
      }
      fieldsFile[0].default = new Date(value).getTime();
      break;
    case 'Location':
      fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      if (field.value) fieldsFile[0].default = `lat:${field.value.lat}, long:${field.value.lon}`;
      moduleFile = TEXT_MODULE_TEMPLATE;
      break;
    case 'Array':
      fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      if (field.value) fieldsFile[0].default = field.value.join(', ');
      moduleFile = TEXT_MODULE_TEMPLATE;
      break;
    case 'Link':
      fieldsFile = structuredClone(IMAGE_FIELD_TEMPLATE);
      if (field.value) {
        fieldsFile[0].default.src = field.value.url;
        fieldsFile[0].default.width = field.value.width;
        fieldsFile[0].default.height = field.value.height;
      }
      moduleFile = IMAGE_MODULE_TEMPLATE;
      break;
    default:
      throw new Error(`Unsupported field type: ${type}`);
  }
  return { fieldsFile: JSON.stringify(fieldsFile), moduleFile };
};
