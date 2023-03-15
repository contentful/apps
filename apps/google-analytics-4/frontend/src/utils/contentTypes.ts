import { EditorInterface } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypes, AllContentTypes, EditorInterfaceAssignment } from '../types';
import sortBy from 'lodash/sortBy';

export const assignAppToContentTypeSidebar = (
  contentTypeIds: string[],
  position: number
): EditorInterfaceAssignment => {
  const sidebarAssignments = contentTypeIds.reduce(
    (acc: EditorInterfaceAssignment, contentTypeId) => {
      const sidebarPosition = {
        sidebar: { position },
      };
      acc[contentTypeId] = sidebarPosition;
      return acc;
    },
    {}
  );

  return sidebarAssignments;
};

export const syncContentTypes = (
  contentTypes: ContentTypes,
  allContentTypes: AllContentTypes,
  editorInterface: Partial<EditorInterface>
): ContentTypes => {
  // Remove content types for which the app has been removed from the sidebar
  const selectedContentTypes = Object.keys(editorInterface);

  const acc = {} as ContentTypes;

  const updatedContentTypes: ContentTypes = selectedContentTypes.reduce((acc, key: string) => {
    const saved = contentTypes[key];

    if (key && saved) {
      acc[key] = saved;
    }

    return acc;
  }, acc);

  // Remove content types and fields that are no longer available
  for (const [type, { slugField }] of Object.entries(updatedContentTypes)) {
    if (
      !(type in allContentTypes) ||
      !allContentTypes[type].fields.some((f) => f.id === slugField)
    ) {
      delete updatedContentTypes[type];
    }
  }

  return updatedContentTypes;
};

export const sortAndFormatContentTypes = (
  contentTypeItems: ContentTypeProps[]
): AllContentTypes => {
  const sortedContentTypes = sortBy(contentTypeItems, ['name']);

  const formattedContentTypes = sortedContentTypes.reduce((acc: AllContentTypes, contentType) => {
    // Only include short text fields
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
