import { WorkflowContentTypeField } from '@types';

export const formatDisplayName = (value: string): string => {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return value;
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  Symbol: 'Short text',
  Text: 'Long text',
  RichText: 'Rich text',
  Integer: 'Integer',
  Number: 'Number',
  Date: 'Date & time',
  Boolean: 'Boolean',
  Object: 'JSON object',
  Location: 'Location',
  Link: 'Media',
  Array: 'List',
  ResourceLink: 'Resource link',
};

export const FIELD_TYPE_DISPLAY = {
  SHORT_TEXT: FIELD_TYPE_LABELS.Symbol,
  LONG_TEXT: FIELD_TYPE_LABELS.Text,
  INTEGER: FIELD_TYPE_LABELS.Integer,
  DECIMAL: FIELD_TYPE_LABELS.Number,
} as const;

export const getFieldTypeLabel = (fieldType: string): string =>
  FIELD_TYPE_LABELS[fieldType] ?? fieldType;

export function isWorkflowContentTypeFieldWithId(
  field: WorkflowContentTypeField
): field is WorkflowContentTypeField & { id: string } {
  return Boolean(field.id);
}

function hasEntryLinkContentTypeValidation(validations: unknown[] | undefined): boolean {
  if (!Array.isArray(validations)) {
    return false;
  }

  return validations.some((validation) => {
    if (!validation || typeof validation !== 'object') {
      return false;
    }

    return Array.isArray((validation as { linkContentType?: unknown }).linkContentType);
  });
}

export function isSingleEntryReferenceField(field: WorkflowContentTypeField): boolean {
  return (
    field.type === 'Link' &&
    (field.fieldControl?.widgetId === 'entryLinkEditor' ||
      hasEntryLinkContentTypeValidation(field.validations))
  );
}

export function isMultipleEntryReferenceField(field: WorkflowContentTypeField): boolean {
  return (
    field.type === 'Array' && field.items?.type === 'Link' && field.items?.linkType === 'Entry'
  );
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

export function getFieldOptionTypeLabel(field: WorkflowContentTypeField): string {
  if (isSingleEntryReferenceField(field)) {
    return 'Reference';
  }

  if (isMultipleEntryReferenceField(field)) {
    return 'References';
  }

  return getFieldTypeLabel(field.type ?? '');
}
