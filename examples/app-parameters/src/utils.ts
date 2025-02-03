import { ContentFields } from 'contentful-management';
import { FIELD_TYPES } from './constants';
import { FieldDetails, getFieldStatusParams } from './locations/Dialog';
import { SelectedContentTypes, SidebarEditorInterface } from './components/AddToSidebarSection';

interface EditorInterfaceAssignment {
  [key: string]: { [key: string]: { position: number; settings: { contentTypeColor: string } } };
}

export const getFieldStatus = ({ disabled, omitted, isTitle }: getFieldStatusParams) => {
  if (isTitle) return 'Entry title';
  if (disabled) {
    if (!omitted) {
      return 'Hidden when editing';
    }
    if (omitted) {
      return 'Excluded from API response';
    }
  }
  if (omitted) {
    return 'Omitted from API response';
  }
  return undefined;
};

export function getFieldType(field: FieldDetails) {
  let type: string;
  if (field.type === 'Array') {
    const itemsType = field.items?.linkType ? field.items?.linkType : field.items?.type ?? '';
    const typeLabel = itemsType ? FIELD_TYPES.find((field) => field.name === itemsType)?.label : '';
    type = typeLabel ? `${typeLabel} (list)` : '';
  } else if (field.type === 'Link' && field.linkType) {
    type = FIELD_TYPES.find((fieldType) => fieldType.name === field.linkType)?.label ?? '';
  } else {
    type = FIELD_TYPES.find((fieldType) => fieldType.name === field.type)?.label ?? '';
  }

  return type;
}

export function generateInvocationParameters(fields: ContentFields[], displayField: string) {
  const fieldDetails = fields.map((field) => {
    return {
      ...field,
      isTitle: field.id === displayField,
    };
  });

  return JSON.stringify(fieldDetails);
}

export const generateEditorInterfaceAssignments = (
  currentEditorInterface: Record<string, SidebarEditorInterface>,
  contentTypes: SelectedContentTypes
): EditorInterfaceAssignment => {
  const savedContentTypeAssignments = Object.keys(currentEditorInterface);

  const newAssignments = { ...(currentEditorInterface as EditorInterfaceAssignment) };
  const contentTypeIds = Object.keys(contentTypes);

  for (const key in currentEditorInterface) {
    if (!contentTypeIds.includes(key)) {
      delete newAssignments[key];
    }
  }

  const assignmentsToAdd = contentTypeIds.reduce(
    (acc: EditorInterfaceAssignment, contentTypeId) => {
      const isNewAssignment = !savedContentTypeAssignments.includes(contentTypeId);
      const isEditedAssignment =
        currentEditorInterface[contentTypeId]?.sidebar?.settings?.contentTypeColor !==
        contentTypes[contentTypeId];
      const position = currentEditorInterface[contentTypeId]?.sidebar?.position ?? 1;

      const sidebarSettings = {
        sidebar: {
          position: isNewAssignment ? 1 : position,
          settings: {
            contentTypeColor: contentTypes[contentTypeId] ?? '',
          },
        },
      };

      if (isNewAssignment || isEditedAssignment) {
        acc[contentTypeId] = sidebarSettings;
      }

      return acc;
    },
    {}
  );

  return { ...newAssignments, ...assignmentsToAdd };
};
