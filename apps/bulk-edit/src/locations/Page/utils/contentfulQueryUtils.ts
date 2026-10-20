import { QueryOptions } from 'contentful-management';
import { ContentTypeField, FieldFilterValue } from '../types';
import { isNumericSearch } from './entryUtils';
import {
  ARCHIVED_STATUS,
  CHANGED_STATUS,
  DRAFT_STATUS,
  ORDERABLE_FIELD_TYPES,
  PUBLISHED_STATUS,
} from './constants';

type DisplayField = { id: string; type: string };

const getOrder = (sortOption: string, displayField: DisplayField | null) => {
  if (sortOption === 'updatedAt_desc') return '-sys.updatedAt';
  else if (sortOption === 'updatedAt_asc') return 'sys.updatedAt';
  else if (displayField === null) return undefined;
  // The CMA rejects ordering by fields such as Text, so fall back to newest updated first
  else if (!ORDERABLE_FIELD_TYPES.includes(displayField.type)) return '-sys.updatedAt';
  else if (sortOption === 'displayName_asc') return `fields.${displayField.id}`;
  else if (sortOption === 'displayName_desc') return `-fields.${displayField.id}`;
};

// The CMA addresses a localized field as `fields.<id>.<locale>`, not by the app's `uniqueId`.
const getFieldQueryPath = (field: ContentTypeField) =>
  field.locale ? `fields.${field.id}.${field.locale}` : `fields.${field.id}`;

const getStatusFilter = (statusLabels: string[]) => {
  // If no statuses selected, return a filter that matches nothing
  if (statusLabels.length === 0) {
    return { 'sys.archivedAt[exists]': false };
  }

  const status = statusLabels[0];

  if (status === ARCHIVED_STATUS) {
    return { 'sys.archivedAt[exists]': true };
  } else if (status === DRAFT_STATUS) {
    // Exclude both published and archived entries to match only true drafts
    return { 'sys.publishedAt[exists]': false, 'sys.archivedAt[exists]': false };
  } else if (status === PUBLISHED_STATUS) {
    return { 'sys.publishedAt[exists]': true, 'sys.archivedAt[exists]': false };
  } else if (status === CHANGED_STATUS) {
    // The CMA does not support `changed: true`; filter by publishedVersion < version instead
    return { 'sys.publishedAt[exists]': true, 'sys.archivedAt[exists]': false };
  }

  return {};
};

export const buildQuery = (
  sortOption: string,
  displayField: DisplayField | null,
  statusLabels: string[],
  selectedContentTypeId: string | undefined,
  activePage: number,
  itemsPerPage: number,
  searchFieldFilterValues: FieldFilterValue[],
  searchQuery: string
): QueryOptions => {
  const query: QueryOptions = {
    content_type: selectedContentTypeId,
    order: getOrder(sortOption, displayField),
    skip: activePage * itemsPerPage,
    limit: itemsPerPage,
    ...getStatusFilter(statusLabels),
    ...fieldFilterValuesToQuery(searchFieldFilterValues).query,
  };

  if (!isNumericSearch(searchQuery) && searchQuery.trim()) {
    query.query = searchQuery.trim();
  }

  return query;
};

export const fieldFilterValuesToQuery = (
  fieldFilterValues: FieldFilterValue[]
): { query: Record<string, string>; queryString: string } => {
  // would like to compare over time, so sorting...
  const sortedFieldFilterValues = fieldFilterValues
    .slice()
    .sort((a, b) => a.fieldUniqueId.localeCompare(b.fieldUniqueId));

  const query: Record<string, string> = {};
  const queryString: string[] = [];
  sortedFieldFilterValues.forEach((fieldFilterValue) => {
    const operator = fieldFilterValue.operator;
    const isExistenceOperator = operator === 'exists' || operator === 'not exists';

    // Existence operators have no value; all others require one
    if (!fieldFilterValue.value && !isExistenceOperator) {
      return;
    }

    const fieldPath = getFieldQueryPath(fieldFilterValue.contentTypeField);
    let key: string | undefined;
    let value: string | undefined;

    if (
      fieldFilterValue.contentTypeField.type === 'Symbol' ||
      fieldFilterValue.contentTypeField.type === 'Text' ||
      fieldFilterValue.contentTypeField.type === 'Integer' ||
      fieldFilterValue.contentTypeField.type === 'Number' ||
      fieldFilterValue.contentTypeField.type === 'RichText'
    ) {
      if (operator === 'exists') {
        key = `${fieldPath}[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `${fieldPath}[exists]`;
        value = 'false';
      } else {
        key = `${fieldPath}[${operator}]`;
        value = Array.isArray(fieldFilterValue.value)
          ? fieldFilterValue.value.join(',')
          : fieldFilterValue.value ?? undefined;
      }
    } else if (fieldFilterValue.contentTypeField.type === 'Array') {
      const isArrayOfLinks = fieldFilterValue.contentTypeField.items?.type === 'Link';
      const arrayFieldPath = isArrayOfLinks ? `${fieldPath}.sys.id` : fieldPath;

      if (operator === 'exists') {
        key = `${arrayFieldPath}[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `${arrayFieldPath}[exists]`;
        value = 'false';
      } else {
        key = `${arrayFieldPath}[${operator}]`;
        value = Array.isArray(fieldFilterValue.value)
          ? fieldFilterValue.value.join(',')
          : fieldFilterValue.value ?? undefined;
      }
    } else if (fieldFilterValue.contentTypeField.type === 'Link') {
      if (operator === 'exists') {
        key = `${fieldPath}.sys.id[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `${fieldPath}.sys.id[exists]`;
        value = 'false';
      } else {
        key = `${fieldPath}.sys.id[${operator}]`;
        value = Array.isArray(fieldFilterValue.value)
          ? fieldFilterValue.value.join(',')
          : fieldFilterValue.value ?? undefined;
      }
    }

    if (key && value) {
      query[key] = value;
      queryString.push(`${key}=${value}`);
    }
  });

  return {
    query,
    queryString: queryString.join('&'),
  };
};
