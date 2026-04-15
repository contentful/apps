import { type ExcludeSelectionPayload, type WorkflowContentType } from '@types';
import type { EditionModalContent as EditionModalContent } from '../EditionModal';
import { formatDisplayName, getFieldTypeLabel } from '../../fieldFormatting';

export const buildExcludeContentModal = (
  excludeSelection: ExcludeSelectionPayload,
  contentTypes: WorkflowContentType[]
): EditionModalContent => {
  return {
    selectedText: excludeSelection.selectedText,
    locations: excludeSelection.locations.map((location, index) => {
      const contentType = contentTypes.find(
        (contentTypeItem) => contentTypeItem.sys.id === location.contentTypeId
      );
      const contentTypeName = contentType?.name ?? location.contentTypeId;
      const fieldName =
        location.fieldName ??
        contentType?.fields.find((field) => field.id === location.fieldId)?.name ??
        formatDisplayName(location.fieldId);
      const displayField = contentType?.displayField ?? 'Untitled';
      const displayFieldName =
        contentType?.fields.find((field) => field.id === displayField)?.name ?? displayField;

      return {
        id: location.id || `${location.contentTypeId}-${location.fieldId}-${index}`,
        contentType: contentTypeName,
        entryName: displayFieldName,
        fieldId: location.fieldId,
        fieldName,
        fieldType: getFieldTypeLabel(location.fieldType),
        sourceRef: location.sourceRef,
        isSelected: location.isSelected ?? index === 0,
      };
    }),
  };
};
