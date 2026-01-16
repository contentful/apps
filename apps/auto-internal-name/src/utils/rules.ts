import { ContentTypeProps } from 'contentful-management';
import { FieldSelection, Rule } from './types';

const getFieldUniqueId = (contentTypeId: string, fieldId: string) => `${contentTypeId}.${fieldId}`;

export const getFieldSelectionsFromContentTypes = (
  contentTypes: ContentTypeProps[]
): FieldSelection[] => {
  return contentTypes
    .flatMap((contentType) => {
      const singlelineFields = contentType.fields.filter((field) => field.type === 'Symbol');

      return singlelineFields.map((field) => ({
        fieldUniqueId: getFieldUniqueId(contentType.sys.id, field.id),
        fieldId: field.id,
        fieldName: field.name,
        contentTypeId: contentType.sys.id,
        contentTypeName: contentType.name,
        displayName: `${field.name} | ${contentType.name}`,
      }));
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const getRuleKey = (rule: Rule) => {
  if (!rule.parentField || !rule.referenceField) {
    return null;
  }
  return `${rule.parentField.fieldUniqueId}::${rule.referenceField.fieldUniqueId}`;
};
