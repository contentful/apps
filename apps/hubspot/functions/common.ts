import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { ContentFields, createClient, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';
import { InvalidHubspotTokenError, MissingHubspotScopesError } from './exceptions';
import {
  DATE_FIELD_TEMPLATE,
  DATE_MODULE_TEMPLATE,
  DATETIME_FIELD_TEMPLATE,
  DATETIME_MODULE_TEMPLATE,
  IMAGE_FIELD_TEMPLATE,
  IMAGE_MODULE_TEMPLATE,
  NUMBER_FIELD_TEMPLATE,
  NUMBER_MODULE_TEMPLATE,
  RICH_TEXT_FIELD_TEMPLATE,
  RICH_TEXT_MODULE_TEMPLATE,
  TEXT_FIELD_TEMPLATE,
  TEXT_MODULE_TEMPLATE,
} from './templates';

export function initContentfulManagementClient(context: FunctionEventContext): PlainClientAPI {
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

export const createModuleFile = async (
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
    const error = await response.json();
    if (error?.category === 'INVALID_AUTHENTICATION') {
      throw new InvalidHubspotTokenError(error.message);
    }
    if (error?.category === 'MISSING_SCOPES') {
      throw new MissingHubspotScopesError(error.message);
    }
    const errorData = await response.text();
    throw new Error(
      `HubSpot API request failed: ${response.status} ${response.statusText} - ${errorData}`
    );
  }
};

export const stringifyFieldValue = (fieldValue: any, field: ContentFields<KeyValueMap>): string => {
  switch (field.type) {
    case 'Symbol':
    case 'Text':
    case 'Integer':
    case 'Number':
    case 'Boolean':
      return String(fieldValue);

    case 'Date':
      return new Date(fieldValue).toISOString();

    case 'Object':
      return JSON.stringify(fieldValue);

    case 'RichText':
      return documentToHtmlString(fieldValue);

    case 'Location':
      return `lat:${fieldValue.lat},long:${fieldValue.lon}`;

    default:
      throw new Error(`Field type '${field.type}' is not supported`);
  }
};

export const getFiles = (type: string, value: any): { fieldsFile: string; moduleFile: string } => {
  let fieldsFile;
  let moduleFile;
  switch (type) {
    case 'Symbol':
    case 'Text':
      fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      if (value) fieldsFile[0].default = value;
      moduleFile = TEXT_MODULE_TEMPLATE;
      break;
    case 'RichText':
      fieldsFile = structuredClone(RICH_TEXT_FIELD_TEMPLATE);
      if (value) fieldsFile[0].default = documentToHtmlString(value);
      moduleFile = RICH_TEXT_MODULE_TEMPLATE;
      break;
    case 'Number':
    case 'Integer':
      fieldsFile = structuredClone(NUMBER_FIELD_TEMPLATE);
      if (value) fieldsFile[0].default = value;
      moduleFile = NUMBER_MODULE_TEMPLATE;
      break;
    case 'Date':
      const stringValue = value as string;
      if (!stringValue || stringValue.includes('T')) {
        fieldsFile = structuredClone(DATETIME_FIELD_TEMPLATE);
        moduleFile = DATETIME_MODULE_TEMPLATE;
      } else {
        fieldsFile = structuredClone(DATE_FIELD_TEMPLATE);
        moduleFile = DATE_MODULE_TEMPLATE;
      }
      fieldsFile[0].default = new Date(stringValue).getTime();
      break;
    case 'Location':
      fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      if (value) fieldsFile[0].default = `lat:${value.lat}, long:${value.lon}`;
      moduleFile = TEXT_MODULE_TEMPLATE;
      break;
    case 'Array':
      fieldsFile = structuredClone(TEXT_FIELD_TEMPLATE);
      if (value) fieldsFile[0].default = value.join(', ');
      moduleFile = TEXT_MODULE_TEMPLATE;
      break;
    case 'Link':
      fieldsFile = structuredClone(IMAGE_FIELD_TEMPLATE);
      if (value) {
        fieldsFile[0].default.src = value.url;
        fieldsFile[0].default.width = value.width;
        fieldsFile[0].default.height = value.height;
      }
      moduleFile = IMAGE_MODULE_TEMPLATE;
      break;
    default:
      throw new Error(`Unsupported field type: ${type}`);
  }
  return { fieldsFile: JSON.stringify(fieldsFile), moduleFile };
};
