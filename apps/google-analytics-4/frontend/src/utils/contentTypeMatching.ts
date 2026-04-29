import { ContentTypeValue } from 'types';

const TOKEN_REGEX = /\{([^}]+)\}/g;

export const hasAdvancedMatchingConfigured = (contentTypeValue: ContentTypeValue) =>
  Boolean(
    contentTypeValue.enableAdvancedMatching ||
      contentTypeValue.pathPattern?.trim() ||
      contentTypeValue.matchDimension === 'pagePathPlusQueryString' ||
      contentTypeValue.matchType === 'PARTIAL_REGEXP'
  );

export const getPatternTokens = (pathPattern = '') =>
  Array.from(pathPattern.matchAll(TOKEN_REGEX), ([, token]) => token);

export const getUnknownPatternTokens = (
  pathPattern = '',
  additionalFieldIds: string[] = []
) => {
  const allowedTokens = new Set(['slug', ...additionalFieldIds]);

  return getPatternTokens(pathPattern).filter((token) => !allowedTokens.has(token));
};
