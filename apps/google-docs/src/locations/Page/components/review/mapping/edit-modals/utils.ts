import type { WorkflowContentTypeField } from '@types';
import { FIELD_TYPE_DISPLAY, getFieldTypeLabel } from '../fieldFormatting';

const LINK_OR_MEDIA_FIELD_TYPE = getFieldTypeLabel('Link');
const ARRAY_OR_LIST_FIELD_TYPE = getFieldTypeLabel('Array');

/** `fieldOptions` may use CMA types (tests) or display labels (MappingView). */
export function isLinkOrArrayFieldType(fieldType: string): boolean {
  return (
    fieldType === 'Link' ||
    fieldType === 'Array' ||
    fieldType === LINK_OR_MEDIA_FIELD_TYPE ||
    fieldType === ARRAY_OR_LIST_FIELD_TYPE
  );
}

export function isWorkflowContentTypeFieldWithId(
  field: WorkflowContentTypeField
): field is WorkflowContentTypeField & { id: string } {
  return Boolean(field.id);
}

function hasAssetLinkValidation(validations: unknown[] | undefined): boolean {
  if (!Array.isArray(validations)) {
    return false;
  }
  return validations.some((validation) => {
    if (!validation || typeof validation !== 'object') {
      return false;
    }
    const maybeLinkType = (validation as { linkType?: unknown }).linkType;
    if (Array.isArray(maybeLinkType)) {
      return maybeLinkType.includes('Asset');
    }
    return maybeLinkType === 'Asset';
  });
}

function isAssetLinkField(
  value: Pick<WorkflowContentTypeField, 'type' | 'linkType' | 'validations'>
): boolean {
  return (
    value.type === 'Link' &&
    (value.linkType === 'Asset' || hasAssetLinkValidation(value.validations))
  );
}

export function isAssetFieldForImageAssign(field: WorkflowContentTypeField): boolean {
  switch (field.type) {
    case 'Link':
      return isAssetLinkField(field);
    case 'Array':
      return field.items ? isAssetLinkField(field.items) : false;
    default:
      return false;
  }
}

export const getSelectedContentMatch = (value: string) => {
  const trimmedValue = value?.trim() ?? '';

  if (/^[+-]?\d+$/.test(trimmedValue)) {
    return FIELD_TYPE_DISPLAY.INTEGER;
  }

  if (/^[+-]?(?:\d+\.\d+|\d+\.|\.\d+)$/.test(trimmedValue)) {
    return FIELD_TYPE_DISPLAY.DECIMAL;
  }

  return;
};

export const isSelectableFieldType = (fieldType: string, selectedText: string) => {
  const highlightedTextMatch = getSelectedContentMatch(selectedText);
  const normalizedFieldType = getFieldTypeLabel(fieldType).trim();

  switch (normalizedFieldType) {
    case FIELD_TYPE_DISPLAY.SHORT_TEXT:
    case FIELD_TYPE_DISPLAY.LONG_TEXT:
      return true;
    case FIELD_TYPE_DISPLAY.INTEGER:
      return highlightedTextMatch === FIELD_TYPE_DISPLAY.INTEGER;
    case FIELD_TYPE_DISPLAY.DECIMAL:
      return (
        highlightedTextMatch === FIELD_TYPE_DISPLAY.INTEGER ||
        highlightedTextMatch === FIELD_TYPE_DISPLAY.DECIMAL
      );
    default:
      return false;
  }
};
