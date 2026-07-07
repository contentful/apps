import { ContentTypeField, EditorInterface } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { AllContentTypes, EditorInterfaceAssignment } from '../../types';
import sortBy from 'lodash/sortBy';

interface FieldItem {
  type: string;
}

interface CompatibleField {
  type: string;
  items?: FieldItem;
}

export const generateEditorInterfaceAssignments = (
  currentEditorInterface: Partial<EditorInterface>,
  contentTypeIds: string[],
  location: string,
  position: number
): EditorInterfaceAssignment => {
  const savedContentTypeAssignments = Object.keys(currentEditorInterface);

  const newAssignments = { ...(currentEditorInterface as EditorInterfaceAssignment) };

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

export const isSlugFieldType = (field: CompatibleField): boolean => {
  const isArray = field.type === 'Array';
  return field.type === 'Symbol' || (isArray && field.items?.type === 'Symbol');
};

// only include fields that can be represented in URL path or query segments
export const isUrlPatternFieldType = (field: CompatibleField): boolean => {
  return isSlugFieldType(field) || field.type === 'Integer';
};

export const sortAndFormatAllContentTypes = (
  contentTypeItems: ContentTypeProps[]
): AllContentTypes => {
  const sortedContentTypes = sortBy(contentTypeItems, ['name']);

  const formattedContentTypes = sortedContentTypes.reduce((acc: AllContentTypes, contentType) => {
    const fields = sortBy(contentType.fields.filter(isUrlPatternFieldType), ['name']);

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
