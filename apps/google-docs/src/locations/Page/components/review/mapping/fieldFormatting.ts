import type { WorkflowContentTypeField } from '@types';

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

export const FIELD_TYPE_LABELS: Record<string, string> = {
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

export type FieldItems = NonNullable<WorkflowContentTypeField['items']>;

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

export const displayType = (type: string, linkType?: string, items?: FieldItems) => {
  switch (type) {
    case 'Symbol':
      return FIELD_TYPE_LABELS.Symbol;
    case 'Text':
      return FIELD_TYPE_LABELS.Text;
    case 'RichText':
      return FIELD_TYPE_LABELS.RichText;
    case 'Link':
      return linkType === 'Entry' ? 'Reference' : 'Media';
    case 'Array':
      if (items?.type === 'Symbol') return 'Short text list';
      return items?.linkType === 'Entry' ? 'Reference list' : 'Media list';
    case 'Integer':
      return FIELD_TYPE_LABELS.Integer;
    case 'Number':
      return FIELD_TYPE_LABELS.Number;
    case 'Date':
      return FIELD_TYPE_LABELS.Date;
    case 'Boolean':
      return FIELD_TYPE_LABELS.Boolean;
    case 'Object':
      return FIELD_TYPE_LABELS.Object;
    case 'Location':
      return FIELD_TYPE_LABELS.Location;
    case 'ResourceLink':
      return FIELD_TYPE_LABELS.ResourceLink;
    default:
      return type;
  }
};
