export type EntryStatus = 'any' | 'published' | 'draft' | 'changed' | 'archived';

export type FieldOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'exists'
  | 'is_true'
  | 'is_false'
  | 'links_to';

export interface FieldFilter {
  fieldId: string;
  operator: FieldOperator;
  value: string;
}

export interface QueryFormData {
  contentTypeId: string;
  search?: string;
  status?: EntryStatus;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  sort?: string;
  tags?: string[];
  tagsMatchAll?: boolean;
  concepts?: string[];
  conceptsMatchAll?: boolean;
  fieldFilters?: FieldFilter[];
}

export function buildQuery(data: QueryFormData): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  // Content type (optional)
  if (data.contentTypeId) {
    query.content_type = data.contentTypeId;
  }

  // Full-text search
  if (data.search && data.search.trim()) {
    query.query = data.search.trim();
  }

  // Status filters
  if (data.status && data.status !== 'any') {
    switch (data.status) {
      case 'published':
        query['sys.publishedAt[exists]'] = true;
        query['sys.archivedAt[exists]'] = false;
        break;
      case 'draft':
        query['sys.publishedAt[exists]'] = false;
        query['sys.archivedAt[exists]'] = false;
        break;
      case 'changed':
        query['sys.publishedAt[exists]'] = true;
        query['sys.archivedAt[exists]'] = false;
        // Can't filter changed vs published server-side — post-filter applied client-side
        break;
      case 'archived':
        query['sys.archivedAt[exists]'] = true;
        break;
    }
  }

  // Created date range
  if (data.createdFrom) {
    query['sys.createdAt[gte]'] = data.createdFrom;
  }
  if (data.createdTo) {
    query['sys.createdAt[lte]'] = data.createdTo;
  }

  // Updated date range
  if (data.updatedFrom) {
    query['sys.updatedAt[gte]'] = data.updatedFrom;
  }
  if (data.updatedTo) {
    query['sys.updatedAt[lte]'] = data.updatedTo;
  }

  // Sort order
  if (data.sort) {
    query.order = data.sort;
  }

  // Tags
  if (data.tags && data.tags.length > 0) {
    if (data.tagsMatchAll) {
      query['metadata.tags.sys.id[all]'] = data.tags.join(',');
    } else {
      query['metadata.tags.sys.id[in]'] = data.tags.join(',');
    }
  }

  // Concepts (taxonomy)
  if (data.concepts && data.concepts.length > 0) {
    if (data.conceptsMatchAll) {
      query['metadata.concepts.sys.id[all]'] = data.concepts.join(',');
    } else {
      query['metadata.concepts.sys.id[in]'] = data.concepts.join(',');
    }
  }

  // Field-level filters
  if (data.fieldFilters && data.fieldFilters.length > 0) {
    for (const filter of data.fieldFilters) {
      if (!filter.fieldId || !filter.operator) continue;

      const fieldKey = `fields.${filter.fieldId}`;

      switch (filter.operator) {
        case 'equals':
          query[fieldKey] = filter.value;
          break;
        case 'not_equals':
          query[`${fieldKey}[ne]`] = filter.value;
          break;
        case 'contains':
          query[`${fieldKey}[match]`] = filter.value;
          break;
        case 'gt':
          query[`${fieldKey}[gt]`] = filter.value;
          break;
        case 'gte':
          query[`${fieldKey}[gte]`] = filter.value;
          break;
        case 'lt':
          query[`${fieldKey}[lt]`] = filter.value;
          break;
        case 'lte':
          query[`${fieldKey}[lte]`] = filter.value;
          break;
        case 'exists':
          query[`${fieldKey}[exists]`] = filter.value === 'true';
          break;
        case 'is_true':
          query[fieldKey] = true;
          break;
        case 'is_false':
          query[fieldKey] = false;
          break;
        case 'links_to':
          query[`${fieldKey}.sys.id`] = filter.value;
          break;
      }
    }
  }

  return query;
}

interface SysVersioned {
  sys: {
    version?: number;
    publishedVersion?: number;
    archivedAt?: string;
  };
}

/**
 * Returns a client-side predicate for statuses that the CMA cannot distinguish
 * server-side (published vs changed). Returns null for statuses that are fully
 * handled by the query params alone.
 */
export function getStatusPostFilter(
  status: EntryStatus
): ((entry: SysVersioned) => boolean) | null {
  if (status === 'published') {
    return (entry) => {
      const { version, publishedVersion } = entry.sys;
      return publishedVersion !== undefined && version === publishedVersion + 1;
    };
  }
  if (status === 'changed') {
    return (entry) => {
      const { version, publishedVersion } = entry.sys;
      return (
        publishedVersion !== undefined && version !== undefined && version > publishedVersion + 1
      );
    };
  }
  return null;
}
