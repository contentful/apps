import { ContentTypeProps } from 'contentful-management';
import { AutocompleteItem, Override } from './consts';

export const normalizeString = (str: string) => (str ? str.trim().toLowerCase() : '');

export const getFieldsFrom = (contentTypes: ContentTypeProps[], contentTypeId: string) => {
  if (!contentTypeId) {
    return [];
  }

  const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
  const mappedFields = contentType?.fields.map((field) => ({
    id: field.id,
    name: field.name,
  }));

  return mappedFields ? mappedFields : [];
};

export const getEmptyAutocompleteItem = () => {
  return { id: '', name: '' };
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

  return getEmptyAutocompleteItem();
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

  return getEmptyAutocompleteItem();
};

export const filterItemsByName = (items: Array<{ name: string }>, filterValue: string) => {
  return items.filter((item) => normalizeString(item?.name).includes(normalizeString(filterValue)));
};
