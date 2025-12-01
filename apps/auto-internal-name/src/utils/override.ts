import { CollectionProp, ContentTypeProps } from 'contentful-management';
import { AutocompleteItem, Override } from './types';

export const EMPTY_AUTOCOMPLETE_ITEM = { id: '', name: '' };

export const normalizeString = (str: string) => (str ? str.trim().toLowerCase() : '');

const extractUniqueShortTextFields = (fields: ContentTypeProps['fields']): AutocompleteItem[] => {
  const filteredFields = fields.filter((field) => field.type === 'Symbol');

  return Array.from(new Map(filteredFields.map((field) => [field.id, field])).values());
};

const getUniqueShortTextFieldsFromArray = (contentTypes: ContentTypeProps[]) => {
  const allFields = contentTypes.flatMap((ct) => ct.fields);
  return extractUniqueShortTextFields(allFields);
};

export const getUniqueShortTextFields = (
  contentTypes?: CollectionProp<ContentTypeProps> | ContentTypeProps[]
) => {
  if (!contentTypes) return [];

  const fields = Array.isArray(contentTypes) ? contentTypes : contentTypes.items;
  return getUniqueShortTextFieldsFromArray(fields);
};

export const getFieldsFrom = (contentTypes: ContentTypeProps[], contentTypeId: string) => {
  if (!contentTypeId) return [];

  const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
  return contentType ? extractUniqueShortTextFields(contentType.fields) : [];
};

export const getInitialContentTypeName = (
  contentTypes: ContentTypeProps[],
  overrideItem: Override
) => {
  if (overrideItem.contentTypeId) {
    const contentTypeName =
      contentTypes.find((c) => c.sys.id === overrideItem.contentTypeId)?.name || '';

    return { id: overrideItem.contentTypeId, name: contentTypeName };
  }

  return EMPTY_AUTOCOMPLETE_ITEM;
};

export const getInitialFieldName = (
  contentTypes: ContentTypeProps[],
  overrideItem: Override
): AutocompleteItem => {
  if (overrideItem.contentTypeId && overrideItem.fieldId) {
    const fields = getFieldsFrom(contentTypes, overrideItem.contentTypeId);
    const field = fields.find((f) => f.id === overrideItem.fieldId);

    if (field) {
      return { id: field.id, name: field.name };
    }
  }

  return EMPTY_AUTOCOMPLETE_ITEM;
};

export const filterItemsByName = (items: Array<{ name: string }>, filterValue: string) => {
  return items.filter((item) => normalizeString(item?.name).includes(normalizeString(filterValue)));
};
