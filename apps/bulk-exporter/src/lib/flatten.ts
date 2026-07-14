import type { Document, Block, Inline, Text } from '@contentful/rich-text-types';

export interface Entry {
  sys: {
    id: string;
    createdAt: string;
    updatedAt: string;
    version?: number;
    publishedVersion?: number;
    archivedAt?: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    updatedBy?: {
      sys: {
        id: string;
      };
    };
  };
  fields: Record<string, Record<string, unknown>>;
}

export interface ContentType {
  sys: {
    id: string;
  };
  name?: string;
  displayField?: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    localized: boolean;
    required?: boolean;
    items?: {
      type: string;
      linkType?: string;
    };
    linkType?: string;
  }>;
}

export interface FlattenOptions {
  contentType: ContentType;
  locales: string[];
  fields?: string[];
  resolveReferences?: boolean;
  includeContentTypeName?: boolean;
  userMap?: Record<string, string>;
}

export interface FlatRow {
  [key: string]: string | number | boolean | null;
}

export function flattenEntries(
  entries: Entry[],
  options: FlattenOptions
): FlatRow[] {
  return entries.map(entry => flattenEntry(entry, options));
}

export function flattenEntry(
  entry: Entry,
  options: FlattenOptions
): FlatRow {
  const { contentType, locales, fields, includeContentTypeName = true, userMap = {} } = options;

  const updatedByUserId = entry.sys.updatedBy?.sys.id;
  const updatedByName = updatedByUserId ? (userMap[updatedByUserId] || updatedByUserId) : 'Unknown';

  const row: FlatRow = {
    'Entry ID': entry.sys.id,
    'Created': formatDate(entry.sys.createdAt),
    'Updated': formatDate(entry.sys.updatedAt),
    'Last Updated By': updatedByName,
    'Status': entry.sys.publishedVersion ? 'Published' : 'Draft',
  };

  if (includeContentTypeName) {
    row['Content Type'] = contentType.name || contentType.sys.id;
  }

  const fieldsToProcess = fields && fields.length > 0
    ? (fields
        .map(id => contentType.fields.find(f => f.id === id))
        .filter((f): f is ContentType['fields'][number] => Boolean(f)))
    : contentType.fields;

  for (const field of fieldsToProcess) {
    const fieldValues = entry.fields[field.id];

    if (!fieldValues) {
      for (const locale of locales) {
        const columnName = field.localized
          ? `${field.name} (${locale})`
          : field.name;
        if (!row[columnName]) {
          row[columnName] = null;
        }
      }
      continue;
    }

    if (field.localized) {
      for (const locale of locales) {
        const columnName = `${field.name} (${locale})`;
        const value = fieldValues[locale];
        row[columnName] = formatFieldValue(value, field);
      }
    } else {
      const locale = Object.keys(fieldValues)[0];
      const value = fieldValues[locale];
      row[field.name] = formatFieldValue(value, field);
    }
  }

  return row;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0];
}

function formatFieldValue(
  value: unknown,
  field: { type: string; linkType?: string; items?: { type: string; linkType?: string } }
): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (field.type === 'Link') {
    return formatLink(value);
  }

  if (field.type === 'Array') {
    if (Array.isArray(value)) {
      if (field.items?.type === 'Link') {
        return value.map(formatLink).filter(Boolean).join('; ');
      }
      if (field.items?.type === 'Symbol') {
        return value.join('; ');
      }
      return JSON.stringify(value);
    }
    return null;
  }

  if (field.type === 'RichText') {
    if (typeof value === 'object' && value !== null) {
      const doc = value as Document;
      if (doc.content && Array.isArray(doc.content)) {
        const text = extractTextFromRichText(doc);
        return text || JSON.stringify(value);
      }
    }
    return JSON.stringify(value);
  }

  if (field.type === 'Object' || field.type === 'Location') {
    return JSON.stringify(value);
  }

  if (field.type === 'Symbol' || field.type === 'Text') {
    return String(value);
  }

  if (field.type === 'Integer' || field.type === 'Number') {
    return typeof value === 'number' ? value : Number(value);
  }

  if (field.type === 'Boolean') {
    return Boolean(value);
  }

  if (field.type === 'Date') {
    try {
      return new Date(String(value)).toISOString().split('T')[0];
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function extractTextFromRichText(doc: Document): string {
  const texts: string[] = [];

  function walk(nodes: (Block | Inline | Text)[]): void {
    for (const node of nodes) {
      if (node.nodeType === 'text') {
        const textNode = node as Text;
        if (textNode.value) texts.push(textNode.value);
      } else if ('content' in node && Array.isArray(node.content)) {
        walk(node.content);
      }
    }
  }

  walk(doc.content);
  return texts.join(' ').trim();
}

function formatLink(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    const link = value as {
      sys?: {
        type?: string;
        linkType?: string;
        id?: string;
      };
    };

    if (link.sys?.type === 'Link' && link.sys.linkType && link.sys.id) {
      return link.sys.id;
    }
  }

  return JSON.stringify(value);
}

export function getColumnHeaders(
  contentType: ContentType,
  locales: string[],
  includeContentTypeName = true,
  fields?: string[]
): string[] {
  const headers = [
    'Entry ID',
    'Created',
    'Updated',
    'Last Updated By',
    'Status',
  ];

  if (includeContentTypeName) {
    headers.push('Content Type');
  }

  const fieldsToInclude = fields && fields.length > 0
    ? (fields
        .map(id => contentType.fields.find(f => f.id === id))
        .filter((f): f is ContentType['fields'][number] => Boolean(f)))
    : contentType.fields;

  for (const field of fieldsToInclude) {
    if (field.localized) {
      for (const locale of locales) {
        headers.push(`${field.name} (${locale})`);
      }
    } else {
      headers.push(field.name);
    }
  }

  return headers;
}
