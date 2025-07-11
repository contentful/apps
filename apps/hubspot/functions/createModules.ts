import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';
import { META_JSON_TEMPLATE } from './templates';
import { SelectedSdkField } from '../src/utils/fieldsProcessing';
import { EntryConnectedFields } from '../src/utils/utils';
import { PlainClientAPI } from 'contentful-management';
import ConfigEntryService from '../src/utils/ConfigEntryService';
import { createModuleFile, getFiles, initContentfulManagementClient } from './common';
import { InvalidHubspotTokenError, MissingHubspotScopesError } from './exceptions';

type AppActionParameters = {
  entryId: string;
  fields: string;
};

const updateConnectedFields = async (
  cma: PlainClientAPI,
  entryId: string,
  fields: SelectedSdkField[],
  updatedAt: string
) => {
  const newFields: EntryConnectedFields = fields.map((field) => {
    return {
      fieldId: field.id,
      ...(field.locale ? { locale: field.locale } : {}),
      moduleName: field.moduleName,
      updatedAt: updatedAt,
    };
  });
  const configEntryService = new ConfigEntryService(cma);
  await configEntryService.updateEntryConnectedFields(entryId, newFields);
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
  const cma = initContentfulManagementClient(context);

  const successFields: SelectedSdkField[] = [];
  const failedFields: SelectedSdkField[] = [];
  let invalidToken = false;
  let missingScopes = false;
  for (const field of JSON.parse(event.body.fields)) {
    try {
      await createModule(field, context.appInstallationParameters.hubspotAccessToken);
      successFields.push(field);
    } catch (error) {
      if (error instanceof InvalidHubspotTokenError) {
        invalidToken = true;
        break;
      }
      if (error instanceof MissingHubspotScopesError) {
        missingScopes = true;
        break;
      }
      failedFields.push(field);
    }
  }

  if (successFields.length > 0 && !invalidToken && !missingScopes) {
    await updateConnectedFields(cma, event.body.entryId, successFields, new Date().toISOString());
  }

  return {
    successQuantity: successFields.length,
    failedQuantity: failedFields.length,
    invalidToken,
    missingScopes,
  };
};

const createModule = async (field: SelectedSdkField, token: string) => {
  const { fieldsFile, moduleFile } = getFiles(field.type, field.value);
  const moduleName = field.moduleName;
  await createModuleFile(JSON.stringify(META_JSON_TEMPLATE), 'meta.json', moduleName, token);
  await createModuleFile(fieldsFile, 'fields.json', moduleName, token);
  await createModuleFile(moduleFile, 'module.html', moduleName, token);
};
