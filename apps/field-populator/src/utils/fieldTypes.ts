import { ContentTypeField } from '@contentful/app-sdk';

/**
 * Checks if a field is a Rich Text field
 */
export const isRichTextField = (field: ContentTypeField): boolean => {
  return field.type === 'RichText';
};

/**
 * Checks if a field is a single Asset link field
 */
export const isAssetField = (field: ContentTypeField): boolean => {
  return field.type === 'Link' && field.linkType === 'Asset';
};

/**
 * Checks if a field is a single Entry reference field
 */
export const isEntryField = (field: ContentTypeField): boolean => {
  return field.type === 'Link' && field.linkType === 'Entry';
};

/**
 * Checks if a field is an Array of Asset links
 */
export const isAssetArrayField = (field: ContentTypeField): boolean => {
  return field.type === 'Array' && field.items?.linkType === 'Asset';
};

/**
 * Checks if a field is an Array of Entry references
 */
export const isEntryArrayField = (field: ContentTypeField): boolean => {
  return field.type === 'Array' && field.items?.linkType === 'Entry';
};

/**
 * Gets the display type name for a field
 */
export const getFieldTypeName = (field: ContentTypeField): string => {
  if (isRichTextField(field)) return 'Rich Text';
  if (isAssetField(field)) return 'Asset';
  if (isEntryField(field)) return 'Reference';
  if (isAssetArrayField(field)) return 'Assets';
  if (isEntryArrayField(field)) return 'References';
  if (field.type === 'Array') return 'List';
  return field.type;
};
