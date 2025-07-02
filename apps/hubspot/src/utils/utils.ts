import { PlainClientAPI } from 'contentful-management';

export const CONFIG_CONTENT_TYPE_ID = 'hubspotConfig';
export const CONFIG_ENTRY_ID = 'hubspotConfig';
export const CONFIG_FIELD_ID = 'connectedFields';

export const HUBSPOT_PRIVATE_APPS_URL = 'https://developers.hubspot.com/docs/api/private-apps';

export const CONFIG_SCREEN_INSTRUCTIONS = [
  'Navigate to your Hubspot account settings',
  "In the left hand navigation, click 'Integrations' and select 'Private apps' from the sub menu",
  'Create a new private app',
  "Within your private app, navigate to the 'Auth' tab. There, you can view and copy your private app access token.",
  'Paste your private app access token in the field above',
];

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
  contentBlockId: string;
  error?: { status: number; message: string };
};

export type EntryConnectedFields = ConnectedField[];

export type ConnectedFields = {
  [entryId: string]: EntryConnectedFields;
};

export async function getDefaultLocale(cma: PlainClientAPI): Promise<string> {
  const fallbackLocale = 'en-US';
  try {
    const locales = await cma.locale.getMany({ query: { limit: 1000 } });
    const defaultLocale = locales.items.find((locale) => locale.default);
    return defaultLocale?.code || fallbackLocale;
  } catch (error) {
    console.error('Error fetching default locale:', error);
    return fallbackLocale;
  }
}
