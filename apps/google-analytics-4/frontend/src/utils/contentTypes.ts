import { EditorInterface } from '@contentful/app-sdk';
import { EditorInterfaceAssignment } from '../types';

export const generateEditorInterfaceAssignments = (
  currentEditorInterface: Partial<EditorInterface>,
  contentTypeIds: string[],
  location: string,
  position: number
): EditorInterfaceAssignment => {
  const savedContentTypes = Object.keys(currentEditorInterface);

  const assignments = contentTypeIds.reduce((acc: EditorInterfaceAssignment, contentTypeId) => {
    const assignedLocationAndPosition = {
      [location]: { position },
    };

    if (!savedContentTypes.includes(contentTypeId)) {
      acc[contentTypeId] = assignedLocationAndPosition;
    }

    return acc;
  }, {});

  return assignments;
};
