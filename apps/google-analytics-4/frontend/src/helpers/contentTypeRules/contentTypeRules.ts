import { ContentTypeRule, ContentTypeRules, ContentTypes, ContentTypeValue } from 'types';
import { hasAdvancedMatchingConfigured } from 'utils/contentTypeMatching';

const createRuleId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `rule_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const createDefaultRule = (contentTypeId = ''): ContentTypeRule => ({
  id: createRuleId(),
  contentTypeId,
  slugField: '',
  urlPrefix: '',
  additionalFieldIds: [],
  enableAdvancedMatching: false,
  pathPattern: '',
  matchDimension: 'unifiedPagePathScreen',
  matchType: 'EXACT',
});

export const createRuleFromContentType = (
  contentTypeId: string,
  value: ContentTypeValue
): ContentTypeRule => ({
  id: createRuleId(),
  contentTypeId,
  slugField: value.slugField,
  urlPrefix: value.urlPrefix,
  additionalFieldIds: value.additionalFieldIds || [],
  enableAdvancedMatching: hasAdvancedMatchingConfigured(value),
  pathPattern: value.pathPattern || '',
  matchDimension: value.matchDimension || 'unifiedPagePathScreen',
  matchType: value.matchType || 'EXACT',
});

export const migrateContentTypesToRules = (contentTypes?: ContentTypes): ContentTypeRules => {
  if (!contentTypes) return [];

  return Object.entries(contentTypes).map(([contentTypeId, value]) =>
    createRuleFromContentType(contentTypeId, value)
  );
};

export const normalizeContentTypeRules = (
  contentTypeRules?: ContentTypeRules,
  legacyContentTypes?: ContentTypes
): ContentTypeRules => {
  if (contentTypeRules?.length) {
    return contentTypeRules.map((rule) => ({
      ...(() => {
        const normalizedRule = {
          ...createDefaultRule(rule.contentTypeId),
          ...rule,
        };

        return {
          ...normalizedRule,
          enableAdvancedMatching: hasAdvancedMatchingConfigured(normalizedRule),
        };
      })(),
      id: rule.id || createRuleId(),
    }));
  }

  return migrateContentTypesToRules(legacyContentTypes);
};

export const getUniqueContentTypeIds = (contentTypeRules: ContentTypeRules) =>
  Array.from(
    new Set(
      contentTypeRules.map((rule) => rule.contentTypeId).filter((contentTypeId) => contentTypeId)
    )
  );
