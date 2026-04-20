import { ContentTypeValue } from 'types';
import { hasAdvancedMatchingConfigured } from 'utils/contentTypeMatching';
import { pathJoin } from 'utils/pathJoin';

const SLUG_TOKEN = '{slug}';
const TOKEN_REGEX = /\{([^}]+)\}/g;

type FieldValueMap = Record<string, string | object | undefined>;

const getPatternValue = (token: string, fieldValues: FieldValueMap) => {
  const normalizedFieldValue = token === 'slug' ? fieldValues.slug : fieldValues[token];

  return pathJoin(normalizedFieldValue);
};

const normalizePattern = (pathPattern: string, fieldValues: FieldValueMap) => {
  return pathPattern.replace(TOKEN_REGEX, (_match, token) => getPatternValue(token, fieldValues));
};

const applyTrailingSlash = (path: string, forceTrailingSlash: boolean) => {
  if (!forceTrailingSlash || path.includes('?')) {
    return path;
  }

  return path.endsWith('/') ? path : `${path}/`;
};

export const buildDefaultPathPattern = (
  urlPrefix = '',
  additionalFieldIds: string[] = [],
  matchDimension: ContentTypeValue['matchDimension'] = 'unifiedPagePathScreen'
) => {
  const basePath =
    matchDimension === 'pagePathPlusQueryString'
      ? `/${pathJoin(urlPrefix, SLUG_TOKEN)}`
      : `/${pathJoin(urlPrefix, ...additionalFieldIds.map((fieldId) => `{${fieldId}}`), SLUG_TOKEN)}`;

  if (matchDimension !== 'pagePathPlusQueryString' || additionalFieldIds.length === 0) {
    return basePath;
  }

  const queryString = additionalFieldIds
    .map((fieldId) => `${fieldId}={${fieldId}}`)
    .join('&');

  return `${basePath}?${queryString}`;
};

export const getReportSlug = (
  contentTypeValue: ContentTypeValue,
  slugFieldValue: string | object,
  forceTrailingSlash: boolean
) => {
  const { pathPattern, urlPrefix } = contentTypeValue;
  const fieldValues =
    typeof slugFieldValue === 'object' && !Array.isArray(slugFieldValue)
      ? ({ slug: '', ...slugFieldValue } as FieldValueMap)
      : ({ slug: slugFieldValue } as FieldValueMap);
  const basePath =
    hasAdvancedMatchingConfigured(contentTypeValue) && pathPattern?.trim()
      ? normalizePattern(pathPattern, fieldValues)
      : pathJoin(urlPrefix || '', fieldValues.slug || '');

  return `/${applyTrailingSlash(pathJoin(basePath), forceTrailingSlash)}`;
};

export const pathPatternPreview = (pathPattern: string, additionalFieldIds: string[] = []) => {
  const fieldValues: FieldValueMap = {
    slug: 'example-slug',
  };

  additionalFieldIds.forEach((fieldId) => {
    fieldValues[fieldId] = `example-${fieldId}`;
  });

  return `/${pathJoin(normalizePattern(pathPattern, fieldValues))}`;
};
