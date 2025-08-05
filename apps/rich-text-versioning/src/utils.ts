import { AppState, ContentTypeField } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export interface ContentType {
  id: string;
  name: string;
}

export interface RichTextField {
  id: string;
  name: string;
  type: string;
}

export interface TargetState {
  EditorInterface: AppState['EditorInterface'];
}

export const getRichTextFields = (contentType: {
  fields?: ContentTypeField[];
}): RichTextField[] => {
  if (!contentType.fields) return [];

  return contentType.fields
    .filter((field: ContentTypeField) => field.type === 'RichText')
    .map((field: ContentTypeField) => ({
      id: field.id,
      name: field.name,
      type: field.type,
    }));
};
