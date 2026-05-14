import { ContentTypeValue } from 'types';
import { hasAdvancedMatchingConfigured } from 'utils/contentTypeMatching';
import { pathJoin } from 'utils/pathJoin';

const SLUG_TOKEN = '{slug}';
const TOKEN_REGEX = /\{([^}]+)\}/g;

type FieldValueMap = Record<string, string | number | object | undefined>;

const getPatternValue = (token: string, fieldValues: FieldValueMap) => {
  const normalizedFieldValue = token === 'slug' ? fieldValues.slug : fieldValues[token];

  return pathJoin(normalizedFieldValue);
};

const normalizePattern = (pathPattern: string, fieldValues: FieldValueMap) => {
  return pathPattern.replace(TOKEN_REGEX, (_match, token) => getPatternValue(token, fieldValues));
};

const ensureLeadingSlash = (path: string) => {
  return path.startsWith('/') ? path : `/${path}`;
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
  matchDimension: ContentTypeValue['matchDimension'] = 'unifiedPagePathScreen',
  primaryToken = SLUG_TOKEN
) => {
  const pathTokens = primaryToken
    ? [...additionalFieldIds.map((fieldId) => `{${fieldId}}`), primaryToken]
    : additionalFieldIds.map((fieldId) => `{${fieldId}}`);
  const basePath =
    matchDimension === 'pagePathPlusQueryString'
      ? `/${pathJoin(urlPrefix, primaryToken)}`
      : `/${pathJoin(urlPrefix, ...pathTokens)}`;

  if (matchDimension !== 'pagePathPlusQueryString' || additionalFieldIds.length === 0) {
    return basePath;
  }

  const queryString = additionalFieldIds.map((fieldId) => `${fieldId}={${fieldId}}`).join('&');

  return `${basePath}?${queryString}`;
};

export const getReportSlug = (
  contentTypeValue: ContentTypeValue,
  slugFieldValue: string | number | object,
  forceTrailingSlash: boolean
) => {
  const { pathPattern, urlPrefix } = contentTypeValue;
  const hasAdvancedPattern =
    hasAdvancedMatchingConfigured(contentTypeValue) && Boolean(pathPattern?.trim());
  const fieldValues =
    typeof slugFieldValue === 'object' && !Array.isArray(slugFieldValue)
      ? ({ slug: '', ...slugFieldValue } as FieldValueMap)
      : ({ slug: slugFieldValue } as FieldValueMap);

  if (hasAdvancedPattern) {
    return ensureLeadingSlash(normalizePattern(pathPattern!, fieldValues).trim());
  }

  const basePath = pathJoin(urlPrefix || '', fieldValues.slug || '');

  return `/${applyTrailingSlash(basePath, forceTrailingSlash)}`;
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
