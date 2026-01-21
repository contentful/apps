import { ContentTypeProps } from 'contentful-management';
import { AppInstallationParameters, FieldSelection, Rule } from './types';

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

export const isEntryRecentlyCreated = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const now = new Date();
  const timeDiff = now.getTime() - created.getTime();
  const secondsDiff = timeDiff / 1000;

  return secondsDiff < 30;
};

export const getMatchingRule = (
  contentTypeId: string,
  fieldId: string,
  config: AppInstallationParameters
): Rule | null => {
  if (!contentTypeId || !config.rules.length) return null;

  return (
    config.rules.find(
      (rule) => rule.referenceField?.fieldUniqueId === getFieldUniqueId(contentTypeId, fieldId)
    ) || null
  );
};
