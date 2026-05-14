import { ContentTypeValue, GAStringMatchType } from 'types';

const TOKEN_REGEX = /\{([^}]+)\}/g;
const REGEX_INDICATORS = [/\*/, /\(/, /\[/, /\|/, /\+/, /\^/, /\$/];
const LEGACY_WILDCARD_TOKEN = '__CONTENTFUL_GA4_WILDCARD__';
const REGEX_SPECIAL_CHARACTERS = /[\\^$+?.()|[\]{}]/g;
export const RESERVED_PATTERN_TOKENS = ['locale'] as const;

export const hasAdvancedMatchingConfigured = (contentTypeValue: ContentTypeValue) =>
  Boolean(
    contentTypeValue.enableAdvancedMatching ||
      contentTypeValue.pathPattern?.trim() ||
      contentTypeValue.matchDimension === 'pagePathPlusQueryString' ||
      contentTypeValue.matchType === 'PARTIAL_REGEXP'
  );

export const getPatternTokens = (pathPattern = '') =>
  Array.from(pathPattern.matchAll(TOKEN_REGEX), ([, token]) => token);

export const inferMatchTypeFromPattern = (pathPattern = ''): GAStringMatchType => {
  const normalizedPattern = pathPattern.replace(TOKEN_REGEX, '');

  return REGEX_INDICATORS.some((pattern) => pattern.test(normalizedPattern))
    ? 'PARTIAL_REGEXP'
    : 'EXACT';
};

export const convertWildcardPatternToRegex = (pathPattern = '') => {
  return pathPattern
    .replace(/\.\*/g, LEGACY_WILDCARD_TOKEN)
    .replace(REGEX_SPECIAL_CHARACTERS, '\\$&')
    .replace(/\*/g, '.*')
    .replace(new RegExp(LEGACY_WILDCARD_TOKEN, 'g'), '.*');
};

export const getUnknownPatternTokens = (
  pathPattern = '',
  additionalFieldIds: string[] = [],
  slugField = ''
) => {
  const allowedTokens = new Set([
    ...additionalFieldIds,
    ...RESERVED_PATTERN_TOKENS,
    ...(slugField ? ['slug'] : []),
  ]);

  return getPatternTokens(pathPattern).filter((token) => !allowedTokens.has(token));
};

export const getMissingSelectedPatternTokens = (
  pathPattern = '',
  additionalFieldIds: string[] = []
) => {
  const patternTokens = new Set(getPatternTokens(pathPattern));

  return additionalFieldIds.filter((fieldId) => !patternTokens.has(fieldId));
};
