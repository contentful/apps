import { EditorInterface } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { AllContentTypes, EditorInterfaceAssignment } from '../../types';
import sortBy from 'lodash/sortBy';

export const generateEditorInterfaceAssignments = (
  currentEditorInterface: Partial<EditorInterface>,
  contentTypeIds: string[],
  location: string,
  position: number
): EditorInterfaceAssignment => {
  const savedContentTypeAssignments = Object.keys(currentEditorInterface);

  const newAssignments: any = { ...currentEditorInterface };

  for (const key in currentEditorInterface) {
    if (!contentTypeIds.includes(key)) {
      delete newAssignments[key];
    }
  }

  const assignmentsToAdd = contentTypeIds.reduce(
    (acc: EditorInterfaceAssignment, contentTypeId) => {
      const assignedLocationAndPosition = {
        [location]: { position },
      };

      if (!savedContentTypeAssignments.includes(contentTypeId)) {
        acc[contentTypeId] = assignedLocationAndPosition;
      }

      return acc;
    },
    {}
  );

  return { ...newAssignments, ...assignmentsToAdd };
};

export const sortAndFormatAllContentTypes = (
  contentTypeItems: ContentTypeProps[]
): AllContentTypes => {
  const sortedContentTypes = sortBy(contentTypeItems, ['name']);

  const formattedContentTypes = sortedContentTypes.reduce((acc: AllContentTypes, contentType) => {
    // only include short text fields in the slug field dropdown
    const fields = sortBy(
      contentType.fields.filter((field) => field.type === 'Symbol'),
      ['name']
    );

    if (fields.length) {
      acc[contentType.sys.id] = {
        ...contentType,
        fields,
      };
    }

    return acc;
  }, {});

  return formattedContentTypes;
};
