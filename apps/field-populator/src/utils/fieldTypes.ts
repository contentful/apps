import { ContentTypeField } from '@contentful/app-sdk';

export const isRichTextField = (field: ContentTypeField): boolean => {
  return field.type === 'RichText';
};

export const isAssetField = (field: ContentTypeField): boolean => {
  return field.type === 'Link' && field.linkType === 'Asset';
};

export const isEntryField = (field: ContentTypeField): boolean => {
  return field.type === 'Link' && field.linkType === 'Entry';
};

export const isAssetArrayField = (field: ContentTypeField): boolean => {
  return field.type === 'Array' && field.items?.linkType === 'Asset';
};

export const isEntryArrayField = (field: ContentTypeField): boolean => {
  return field.type === 'Array' && field.items?.linkType === 'Entry';
};

export const isSymbolArrayField = (field: ContentTypeField): boolean => {
  return field.type === 'Array' && field.items?.type === 'Symbol';
};

export const isJsonField = (field: ContentTypeField): boolean => {
  return field.type === 'Object';
};

export interface LinkValue {
  sys: {
    type: 'Link';
    linkType: 'Asset' | 'Entry';
    id: string;
  };
}

export const isLinkValue = (value: unknown): value is LinkValue => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sys' in value &&
    typeof (value as LinkValue).sys === 'object' &&
    (value as LinkValue).sys.type === 'Link'
  );
};

export const isLinkArray = (value: unknown): value is LinkValue[] => {
  return Array.isArray(value) && value.every(isLinkValue);
};
