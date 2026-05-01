import { ContentTypeValue, GAStringMatchType } from 'types';

const TOKEN_REGEX = /\{([^}]+)\}/g;
const REGEX_INDICATORS = [/\.\*/, /\(/, /\[/, /\|/, /\+/, /\^/, /\$/];

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

export const getUnknownPatternTokens = (
  pathPattern = '',
  additionalFieldIds: string[] = [],
  _slugField = ''
) => {
  const allowedTokens = new Set([...additionalFieldIds]);

  return getPatternTokens(pathPattern).filter((token) => !allowedTokens.has(token));
};
