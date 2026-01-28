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
    return { 'sys.publishedAt[exists]': false };
  } else if (status === PUBLISHED_STATUS) {
    return { 'sys.publishedAt[exists]': true, 'sys.archivedAt[exists]': false };
  } else if (status === CHANGED_STATUS) {
    return { 'sys.publishedAt[exists]': true, 'sys.archivedAt[exists]': false, changed: true };
  }

  return {};
};

export const buildQuery = (
  sortOption: string,
  displayField: string | null,
  statusLabels: string[],
  selectedContentTypeId: string | undefined,
  // needsClientFiltering: boolean,
  activePage: number,
  itemsPerPage: number,
  searchFieldFilterValues: FieldFilterValue[],
  searchQuery: string
): QueryOptions => {
  const query: QueryOptions = {
    content_type: selectedContentTypeId,
    order: getOrder(sortOption, displayField),
    // skip: needsClientFiltering ? 0 : activePage * itemsPerPage,
    // limit: needsClientFiltering ? 1000 : itemsPerPage,
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
  const sortedFieldFilterValues = fieldFilterValues.sort((a, b) =>
    a.fieldUniqueId.localeCompare(b.fieldUniqueId)
  );

  const query: Record<string, string> = {};
  const queryString: string[] = [];
  sortedFieldFilterValues.map((fieldFilterValue) => {
    if (!fieldFilterValue.value) {
      return;
    }
    let key, value;
    const operator = fieldFilterValue.operator;

    if (
      fieldFilterValue.contentTypeField.type === 'Symbol' ||
      fieldFilterValue.contentTypeField.type === 'Integer' ||
      fieldFilterValue.contentTypeField.type === 'Number'
    ) {
      if (operator === 'exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}[exists]`;
        value = 'false';
      } else {
        key = `fields.${fieldFilterValue.fieldUniqueId}[${fieldFilterValue.operator}]`;
        value = Array.isArray(fieldFilterValue.value)
          ? fieldFilterValue.value.join(',')
          : fieldFilterValue.value;
      }
    } else if (fieldFilterValue.contentTypeField.type === 'Array') {
      if (operator === 'exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[exists]`;
        value = 'false';
      } else {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[${fieldFilterValue.operator}]`;
        value = Array.isArray(fieldFilterValue.value)
          ? fieldFilterValue.value.join(',')
          : fieldFilterValue.value;
      }
    } else if (fieldFilterValue.contentTypeField.type === 'Link') {
      if (operator === 'exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[exists]`;
        value = 'true';
      } else if (operator === 'not exists') {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[exists]`;
        value = 'false';
      } else {
        key = `fields.${fieldFilterValue.fieldUniqueId}.sys.id[${fieldFilterValue.operator}]`;
        value = Array.isArray(fieldFilterValue.value)
          ? fieldFilterValue.value.join(',')
          : fieldFilterValue.value;
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
