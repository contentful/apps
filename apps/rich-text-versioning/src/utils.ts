import { AppState, ContentTypeField } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export interface FieldWithContext {
  fieldUniqueId: string;
  displayName: string;
  contentTypeId: string;
  fieldId: string;
}

export interface TargetState {
  EditorInterface: AppState['EditorInterface'];
}

export const getRichTextFields = (contentType: { fields?: ContentTypeField[] }) => {
  return contentType.fields?.filter((field) => field.type === 'RichText') || [];
};

export const processContentTypesToFields = (
  contentTypes: ContentTypeProps[]
): FieldWithContext[] => {
  return contentTypes
    .flatMap((contentType) => {
      const richTextFields = getRichTextFields(contentType);

      return richTextFields.map((field) => ({
        fieldUniqueId: `${contentType.sys.id}.${field.id}`,
        displayName: `${contentType.name} > ${field.name}`,
        contentTypeId: contentType.sys.id,
        fieldId: field.id,
      }));
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const restoreSelectedFields = (
  availableFields: FieldWithContext[],
  currentState: TargetState
): FieldWithContext[] => {
  const editorInterface = currentState?.EditorInterface || {};

  return availableFields.filter((field) => {
    const config = editorInterface[field.contentTypeId];
    return config?.controls?.some((control) => control.fieldId === field.fieldId);
  });
};
