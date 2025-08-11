import { AppState, ContentTypeField } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export type ErrorInfo = {
  hasError: boolean;
  errorCode?: string;
  errorMessage?: string;
};

export interface RichTextFieldInfo {
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
): RichTextFieldInfo[] => {
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
  availableFields: RichTextFieldInfo[],
  currentState: TargetState
): RichTextFieldInfo[] => {
  const editorInterface = currentState?.EditorInterface || {};

  return availableFields.filter((field) => {
    const config = editorInterface[field.contentTypeId];
    return config?.controls?.some((control) => control.fieldId === field.fieldId);
  });
};
