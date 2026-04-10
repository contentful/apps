import { QueryOptions } from 'contentful-management';
import { FieldFilterValue } from '../types';
import { isNumericSearch } from './entryUtils';
import { ARCHIVED_STATUS, CHANGED_STATUS, DRAFT_STATUS, PUBLISHED_STATUS } from './constants';

const getOrder = (sortOption: string, displayField: string | null) => {
  if (sortOption === 'updatedAt_desc') return '-sys.updatedAt';
  else if (sortOption === 'updatedAt_asc') return 'sys.updatedAt';
  else if (displayField === null) return undefined;
  else if (sortOption === 'displayName_asc') return `fields.${displayField}`;
  else if (sortOption === 'displayName_desc') return `-fields.${displayField}`;
};

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
  displayField: string | null,
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

    let key: string | undefined;
    let value: string | undefined;

    if (
      fieldFilterValue.contentTypeField.type === 'Symbol' ||
      fieldFilterValue.contentTypeField.type === 'Integer' ||
      fieldFilterValue.contentTypeField.type === 'Number' ||
      fieldFilterValue.contentTypeField.type === 'RichText'
    ) {
      if (operator === 'exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}[exists]`;
        value = 'false';
      } else {
        key = `fields.${fieldFilterValue.fieldUniqueId}[${operator}]`;
        value = Array.isArray(fieldFilterValue.value)
          ? fieldFilterValue.value.join(',')
          : fieldFilterValue.value ?? undefined;
      }
    } else if (fieldFilterValue.contentTypeField.type === 'Array') {
      const isArrayOfLinks = fieldFilterValue.contentTypeField.items?.type === 'Link';
      const fieldPath = isArrayOfLinks
        ? `fields.${fieldFilterValue.fieldUniqueId}.sys.id`
        : `fields.${fieldFilterValue.fieldUniqueId}`;

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
    } else if (fieldFilterValue.contentTypeField.type === 'Link') {
      if (operator === 'exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[exists]`;
        value = 'false';
      } else {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[${operator}]`;
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
