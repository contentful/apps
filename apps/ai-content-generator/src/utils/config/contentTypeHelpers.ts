import { EditorInterface } from '@contentful/app-sdk';

export interface EditorInterfaceAssignment {
  [key: string]: { [key: string]: { position: number } };
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
