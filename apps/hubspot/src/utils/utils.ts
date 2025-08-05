import { ContentTypeProps, EntryProps, KeyValueMap } from 'contentful-management';

export const CONFIG_CONTENT_TYPE_ID = 'hubspotConfig';
export const CONFIG_ENTRY_ID = 'hubspotConfig';
export const CONFIG_FIELD_ID = 'connectedFields';

export const HUBSPOT_PRIVATE_APPS_URL = 'https://developers.hubspot.com/docs/api/private-apps';

export const CONFIG_SCREEN_INSTRUCTIONS = [
  'Navigate to your Hubspot account settings and select ‘Profile and Preferences.’',
  'In the left hand navigation, click ‘Integrations’ and select ‘Private apps’ from the sub menu.',
  'Create a new private app.',
  'Within the ‘Scopes’ tab, add a new scope: ‘content’. Your app must include this scope.',
  'After you finish and click ‘Create’ you will see a confirmation modal, and then a modal with your private app access token.',
  'In the private app access token modal, show the token, and then copy it. ',
  'At any time, within your private app, navigate to the ‘Auth’ tab. There, you can view and copy your private app access token.',
  'Paste your private app access token in the field above.',
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
  locale?: string;
  moduleName: string;
  updatedAt: string;
  error?: { status: number; message: string };
};

export type EntryConnectedFields = ConnectedField[];

export type ConnectedFields = {
  [entryId: string]: EntryConnectedFields;
};

export type FieldItems = {
  type: string;
  linkType?: string;
};

export type EntryWithContentType = {
  entry: EntryProps<KeyValueMap>;
  contentType: ContentTypeProps;
};

export const displayType = (type: string, linkType?: string, items?: FieldItems) => {
  switch (type) {
    case 'Symbol':
      return 'Short text';
    case 'RichText':
      return 'Rich text';
    case 'Link':
      return linkType === 'Entry' ? 'Reference' : 'Media';
    case 'Array':
      if (items?.type === 'Symbol') return 'Short text list';
      return items?.linkType === 'Entry' ? 'Reference list' : 'Media list';
    default:
      return type;
  }
};

export const getEntryTitle = (
  entry: EntryProps<KeyValueMap>,
  contentType: ContentTypeProps,
  locale: string
): string => {
  let displayFieldId = contentType.displayField;
  if (!displayFieldId) return 'Untitled';

  const value = entry.fields[displayFieldId]?.[locale];
  if (value === undefined || value === null || value === '') {
    return 'Untitled';
  }
  return String(value);
};

export const getUniqueFieldId = (fieldId: string, locale?: string): string => {
  return locale ? `${fieldId}.${locale}` : fieldId;
};
