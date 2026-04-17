import { ContentTypeValue } from 'types';

export const hasAdvancedMatchingConfigured = (contentTypeValue: ContentTypeValue) =>
  Boolean(
    contentTypeValue.enableAdvancedMatching ||
      contentTypeValue.pathPattern?.trim() ||
      contentTypeValue.matchDimension === 'pagePathPlusQueryString' ||
      contentTypeValue.matchType === 'PARTIAL_REGEXP'
  );
