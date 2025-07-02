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

export async function createConfig(cma: PlainClientAPI) {
  await createContentType(cma);
  await createEntry(cma);
}

export async function createContentType(cma: PlainClientAPI) {
  const contentTypeBody = {
    name: CONFIG_CONTENT_TYPE_ID,
    description: 'Content Type used by the Hubspot app. Do not delete or modify manually.',
    fields: [
      {
        id: CONFIG_FIELD_ID,
        name: CONFIG_FIELD_ID,
        required: false,
        localized: false,
        type: 'Object',
      },
    ],
  };
  try {
    const contentTypeProps = await cma.contentType.createWithId(
      { contentTypeId: CONFIG_CONTENT_TYPE_ID },
      contentTypeBody
    );
    await cma.contentType.publish({ contentTypeId: CONFIG_CONTENT_TYPE_ID }, contentTypeProps);
  } catch (e: any) {
    // Only ignore error if content type already exists
    if (e?.code !== 'VersionMismatch') {
      throw e;
    }
  }
}

export async function createEntry(cma: PlainClientAPI) {
  try {
    await cma.entry.createWithId(
      { contentTypeId: CONFIG_CONTENT_TYPE_ID, entryId: CONFIG_ENTRY_ID },
      { fields: {} }
    );
  } catch (e: any) {
    // Only ignore error if entry already exists
    if (e?.code !== 'VersionMismatch') {
      throw e;
    }
  }
}
