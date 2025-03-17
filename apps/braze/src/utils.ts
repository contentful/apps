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
export const DIALOG_TITLE = 'Generate Braze Connected Content Call';
export const SIDEBAR_BUTTON_TEXT = 'Generate Braze Connected Content';

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
