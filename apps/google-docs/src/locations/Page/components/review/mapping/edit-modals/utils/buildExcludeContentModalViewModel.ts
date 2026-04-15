import { type ExcludeSelectionPayload, type WorkflowContentType } from '@types';
import type { EditionModalViewModel } from '../EditionModal';
import { formatDisplayName, getFieldTypeLabel } from '../../fieldFormatting';

export const buildExcludeContentModalViewModel = (
  excludeSelection: ExcludeSelectionPayload,
  contentTypes: WorkflowContentType[]
): EditionModalViewModel => {
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

/*
return {
  selectedContent: getSelectedContent(duplicateGroup[0].sourceRef),
  locations: duplicateGroup.map((item, index) => {
    const contentType =
      contentTypes.find((contentType) => contentType.sys.id === item.contentTypeId);
    const contentTypeName = contentType?.name ??
      item.contentTypeId;
    const fieldName = contentType?.fields.find((field) => field.id === item.fieldId)?.name ?? item.fieldId;
    const displayField = contentType?.displayField ?? "Untitled";
    const displayFieldName = contentType?.fields.find((field) => field.id === displayField)?.name ?? displayField;

    return {
      id: `${item.entryIndex}-${item.fieldId}-${index}`,
      contentType: contentTypeName,
      entryName: displayFieldName,
      fieldName,
      fieldType: getFieldTypeLabel(item.fieldType),
      isSelected: index === 0,
    };
  }),
};
*/
