import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { META_JSON_TEMPLATE, TEXT_FIELD_TEMPLATE, TEXT_MODULES_TEMPLATE } from './templates';
import { SdkField } from '../src/utils';

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

const createModule = async (field: SdkField, token: string) => {
  // TODO: change templates to use depending on field type
  // TODO: transform field value depending on field type
  await createModuleFile(JSON.stringify(META_JSON_TEMPLATE), 'meta.json', field.uniqueId, token);

  const fields = TEXT_FIELD_TEMPLATE;
  fields[0].default = field.value;
  await createModuleFile(JSON.stringify(fields), 'fields.json', field.uniqueId, token);

  await createModuleFile(TEXT_MODULES_TEMPLATE, 'module.html', field.uniqueId, token);
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
