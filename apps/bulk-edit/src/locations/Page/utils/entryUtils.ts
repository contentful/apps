import { Entry, ContentTypeField, Status, Fields } from '../types';
import { ContentTypeProps } from 'contentful-management';

export const getStatus = (entry: Entry): Status => {
  const { sys } = entry;
  if (!sys.publishedVersion) {
    return { label: 'Draft', color: 'warning' };
  }
  if (sys.version >= sys.publishedVersion + 2) {
    return { label: 'Changed', color: 'primary' };
  }
  if (sys.version === sys.publishedVersion + 1) {
    return { label: 'Published', color: 'positive' };
  }
  return { label: 'Unknown', color: 'negative' };
};

export const isLocationValue = (value: unknown): value is { lat: number; lon: number } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lat' in value &&
    'lon' in value &&
    typeof (value as any).lat === 'number' &&
    typeof (value as any).lon === 'number'
  );
};

export const isLinkValue = (value: unknown): value is { sys: { linkType: string } } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'sys' in value &&
    'linkType' in (value as any).sys
  );
};

export const truncate = (str: string, max: number = 20) =>
  str.length > max ? str.slice(0, max) + ' ...' : str;

export const renderFieldValue = (field: ContentTypeField, value: unknown): string => {
  if (field.type === 'Array' && Array.isArray(value)) {
    const count = value.length;
    if (value[0]?.sys?.linkType === 'Entry') {
      return count === 1 ? '1 reference field' : `${count} reference fields`;
    } else if (value[0]?.sys?.linkType === 'Asset') {
      return count === 1 ? '1 asset' : `${count} assets`;
    } else {
      return truncate(value.join(', '));
    }
  }

  if (field.type === 'Location' && isLocationValue(value)) {
    return truncate(`Lat: ${value.lat}, Lon: ${value.lon}`);
  }
  if (field.type === 'Boolean' && typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (field.type === 'Object' && typeof value === 'object' && value !== null) {
    return truncate(JSON.stringify(value));
  }

  if (field.type === 'Link' && isLinkValue(value) && value.sys.linkType === 'Asset') {
    return `1 asset`;
  }
  if (field.type === 'Link' && isLinkValue(value) && value.sys.linkType === 'Entry') {
    return `1 reference field`;
  }

  if (typeof value === 'object' && value !== null) {
    return '';
  }

  return value !== undefined && value !== null ? truncate(String(value)) : '-';
};

export const getEntryTitle = (
  entry: Entry,
  contentType: ContentTypeProps,
  locale: string
): string => {
  let displayFieldId = contentType.displayField;
  if (!displayFieldId) return 'Untitled';

  const value = entry.fields[displayFieldId]?.[locale];
  if (value === undefined || value === null || value === '') {
    return 'Untitled';
  }
  return String(value);
};

export const getEntryUrl = (entry: Entry, spaceId: string, environmentId: string): string => {
  return `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entry.sys.id}`;
};

export const isCheckboxAllowed = (field: ContentTypeField): boolean => {
  const restrictedTypes = [
    'Location',
    'Date',
    'Asset',
    'Array',
    'Link',
    'ResourceLink',
    'Boolean',
    'Object',
    'RichText',
  ];

  if (!field.type) return false;

  if (restrictedTypes.includes(field.type)) return false;
  return true;
};

/**
 * Returns a new fields object with the given field updated for the specified locale.
 * If the field or locale does not exist, it is created.
 */
export function updateEntryFieldLocalized(
  fields: Fields,
  fieldId: string,
  value: any,
  locale: string
) {
  return {
    ...fields,
    [fieldId]: {
      ...(fields[fieldId] || {}),
      [locale]: value,
    },
  };
}

export function getEntryFieldValue(
  entry: any,
  field: { id: string; locale?: string } | null | undefined,
  defaultLocale: string
): string {
  if (!entry || !field || !field.id) return '';
  return entry.fields[field.id]?.[field.locale || defaultLocale].toString() || 'empty field';
}
