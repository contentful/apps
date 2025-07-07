import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import { createClient, PlainClientAPI } from 'contentful-management';

export const CONFIG_CONTENT_TYPE_ID = 'hubspotConfig';
export const CONFIG_ENTRY_ID = 'hubspotConfig';
export const CONFIG_FIELD_ID = 'connectedFields';

export const HUBSPOT_PRIVATE_APPS_URL = 'https://developers.hubspot.com/docs/api/private-apps';

export const CONFIG_SCREEN_INSTRUCTIONS = [
  'Navigate to your Hubspot account settings',
  "In the left hand navigation, click 'Integrations' and select 'Private apps' from the sub menu",
  'Create a new private app',
  "Your private app must include the scope 'content'",
  "Within your private app, navigate to the 'Auth' tab. There, you can view and copy your private app access token.",
  'Paste your private app access token in the field above',
];

export const MODULE_NAME_PATTERN = /^[a-zA-Z0-9_\-]+$/;

export interface ContentType {
  id: string;
  name: string;
}

export type AppInstallationParameters = {
  hubspotAccessToken: string;
};

export type ConnectedField = {
  fieldId: string;
  locale: string;
  moduleId: string;
  updatedAt: string;
  error?: { status: number; message: string };
};

export type EntryConnectedFields = ConnectedField[];

export type ConnectedFields = {
  [entryId: string]: EntryConnectedFields;
};

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
