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
export const BRAZE_ENDPOINTS_LIST =
  'https://www.braze.com/docs/api/basics#braze-rest-api-collection';

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
