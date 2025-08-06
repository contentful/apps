import { AppState, ContentTypeField } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export interface ContentType {
  id: string;
  name: string;
}

export interface Field {
  id: string;
  name: string;
  type: string;
}

export interface FieldWithContext {
  fieldUniqueId: string;
  displayName: string;
  contentTypeId: string;
  fieldId: string;
}

export interface TargetState {
  EditorInterface: AppState['EditorInterface'];
}

export const getRichTextFields = (contentType: { fields?: ContentTypeField[] }): Field[] => {
  if (!contentType.fields) return [];

  return contentType.fields
    .filter((field: ContentTypeField) => field.type === 'RichText')
    .map((field: ContentTypeField) => ({
      id: field.id,
      name: field.name,
      type: field.type,
    }));
};

export const processContentTypesToFields = (
  contentTypes: ContentTypeProps[]
): FieldWithContext[] => {
  return contentTypes
    .filter((ct) => getRichTextFields(ct).length > 0)
    .flatMap((contentType) =>
      getRichTextFields(contentType).map((field) => ({
        fieldUniqueId: `${contentType.sys.id}.${field.id}`,
        displayName: `${contentType.name} > ${field.name}`,
        contentTypeId: contentType.sys.id,
        fieldId: field.id,
      }))
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const restoreSelectedFields = (
  availableFields: FieldWithContext[],
  currentState: TargetState
): FieldWithContext[] => {
  const currentEditorInterface = currentState?.EditorInterface || {};

  return availableFields.filter((field) => {
    const config = currentEditorInterface[field.contentTypeId];

    return config?.controls?.some((control) => control.fieldId === field.fieldId);
  });
};
