import { AppState, ContentTypeField } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export interface ContentTypeInfo {
  fieldUniqueId: string;
  displayName: string;
  contentTypeId: string;
  fieldId: string;
}

export interface TargetState {
  EditorInterface: AppState['EditorInterface'];
}

export const getJsonObjectFields = (contentType: { fields?: ContentTypeField[] }) => {
  return contentType.fields?.filter((field) => field.type === 'Object') || [];
};

export const processContentTypesToFields = (
  contentTypes: ContentTypeProps[]
): ContentTypeInfo[] => {
  return contentTypes
    .flatMap((contentType) => {
      const jsonObjectFields = getJsonObjectFields(contentType);

      return jsonObjectFields.map((field) => ({
        fieldUniqueId: `${contentType.sys.id}.${field.id}`,
        displayName: `${contentType.name} > ${field.name}`,
        contentTypeId: contentType.sys.id,
        fieldId: field.id,
      }));
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const loadSavedSelections = (
  availableFields: ContentTypeInfo[],
  currentState: TargetState
): ContentTypeInfo[] => {
  const editorInterface = currentState?.EditorInterface || {};

  return availableFields.filter((field) => {
    const config = editorInterface[field.contentTypeId];
    return config?.controls?.some((control) => control.fieldId === field.fieldId);
  });
};
