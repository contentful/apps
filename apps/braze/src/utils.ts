import { CMAClient } from '@contentful/app-sdk';
import { EntryProps, KeyValueMap } from 'contentful-management';

export const SAVED_RESPONSE = 'response';
export const ASSET_FIELDS_QUERY = [
  'title',
  'description',
  'url',
  'contentType',
  'fileName',
  'size',
  'width',
  'height',
];
export const ASSET_FIELDS = ['title', 'description', 'url'];
export const GENERATE_DIALOG_TITLE = 'Generate Braze Connected Content Call';
export const CREATE_DIALOG_TITLE = 'Generate Braze Content Blocks';
export const SIDEBAR_GENERATE_BUTTON_TEXT = 'Generate';
export const SIDEBAR_CREATE_BUTTON_TEXT = 'Create';
export const SIDEBAR_CONNECTED_ENTRIES_BUTTON_TEXT = 'View all connected entries';
export const CREATE_DIALOG_MODE = 'create';
export const GENERATE_DIALOG_MODE = 'generate';
export const FIELDS_STEP = 'fields';

export const CONNECTED_CONTENT_DOCUMENTATION =
  'https://www.braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content';
export const CONTENT_TYPE_DOCUMENTATION =
  'https://www.contentful.com/help/content-types/configure-content-type/';
export const BRAZE_APP_DOCUMENTATION = 'https://www.contentful.com/help/apps/braze-app/';
export const BRAZE_API_KEY_DOCUMENTATION = `https://dashboard.braze.com/app_settings/developer_console/apisettings#apikeys`;
export const BRAZE_CONTENT_BLOCK_DOCUMENTATION =
  'https://www.braze.com/docs/api/endpoints/templates/content_blocks_templates/post_create_email_content_block';
export const BRAZE_ENDPOINTS_DOCUMENTATION =
  'https://www.braze.com/docs/api/basics#braze-rest-api-collection';

export type BrazeEndpoint = {
  name: string;
  url: string;
};

export const BRAZE_ENDPOINTS: BrazeEndpoint[] = [
  {
    name: 'rest.iad-01.braze.com',
    url: 'https://rest.iad-01.braze.com',
  },
  {
    name: 'rest.iad-02.braze.com',
    url: 'https://rest.iad-02.braze.com',
  },
  {
    name: 'rest.iad-03.braze.com',
    url: 'https://rest.iad-03.braze.com',
  },
  {
    name: 'rest.iad-04.braze.com',
    url: 'https://rest.iad-04.braze.com',
  },
  {
    name: 'rest.iad-05.braze.com',
    url: 'https://rest.iad-05.braze.com',
  },
  {
    name: 'rest.iad-06.braze.com',
    url: 'https://rest.iad-06.braze.com',
  },
  {
    name: 'rest.iad-07.braze.com',
    url: 'https://rest.iad-07.braze.com',
  },
  {
    name: 'rest.iad-08.braze.com',
    url: 'https://rest.iad-08.braze.com',
  },
  {
    name: 'rest.us-10.braze.com',
    url: 'https://rest.us-10.braze.com',
  },
  {
    name: 'rest.fra-01.braze.eu',
    url: 'https://rest.fra-01.braze.eu',
  },
  {
    name: 'rest.fra-02.braze.eu',
    url: 'https://rest.fra-02.braze.eu',
  },
  {
    name: 'rest.au-01.braze.com',
    url: 'https://rest.au-01.braze.com',
  },
  {
    name: 'rest.id-01.braze.com',
    url: 'https://rest.id-01.braze.com',
  },
];

export const CONFIG_CONTENT_TYPE_ID = 'brazeConfig';
export const CONFIG_ENTRY_ID = 'brazeConfig';
export const CONFIG_FIELD_ID = 'connectedFields';

export type AppInstallationParameters = {
  apiKey?: string;
  contentfulApiKey: string;
  brazeApiKey: string;
  brazeEndpoint: string;
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

export type SidebarContentBlockInfo = {
  fieldId: string;
  locale: string;
  contentBlockId: string;
  contentBlockName: string;
};

export const MULTISELECT_DIALOG_HEIGHT = 36 * 4; // Shows 4 items

export enum EntryStatus {
  Draft = 'DRAFT',
  Changed = 'CHANGED',
  Published = 'PUBLISHED',
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function firstLetterToLowercase(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export function removeIndentation(str: string) {
  return ('' + str).replace(/(\n)\s+/g, '$1');
}

export function removeHypens(str: string) {
  return str.replace('-', '');
}

async function getDefaultLocale(cma: CMAClient): Promise<string> {
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

export async function updateConfig(
  configEntry: EntryProps<KeyValueMap>,
  connectedFields: ConnectedFields,
  cma: CMAClient,
  defaultLocale?: string
) {
  if (!configEntry.fields[CONFIG_FIELD_ID]) {
    configEntry.fields[CONFIG_FIELD_ID] = {};
  }
  defaultLocale ||= await getDefaultLocale(cma);
  configEntry.fields[CONFIG_FIELD_ID][defaultLocale] = connectedFields;
  return await cma.entry.update({ entryId: CONFIG_ENTRY_ID }, configEntry);
}

export async function getConfigEntry(cma: CMAClient): Promise<EntryProps<KeyValueMap>> {
  return await cma.entry.get({ entryId: CONFIG_ENTRY_ID });
}

export const localizeFieldId = (fieldId: string, locale?: string) => {
  return locale ? `${fieldId}-${locale}` : fieldId;
};
