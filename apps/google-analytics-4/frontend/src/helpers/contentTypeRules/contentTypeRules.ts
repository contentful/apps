import { ContentTypeRule, ContentTypeRules, ContentTypes, ContentTypeValue } from 'types';
import {
  hasAdvancedMatchingConfigured,
  inferMatchTypeFromPattern,
} from 'utils/contentTypeMatching';

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
  matchType:
    hasAdvancedMatchingConfigured(value) && value.pathPattern
      ? inferMatchTypeFromPattern(value.pathPattern)
      : value.matchType || 'EXACT',
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
  if (contentTypeRules !== undefined) {
    return contentTypeRules.map((rule) => ({
      ...(() => {
        const normalizedRule = {
          ...createDefaultRule(rule.contentTypeId),
          ...rule,
        };

        return {
          ...normalizedRule,
          matchType:
            normalizedRule.enableAdvancedMatching && normalizedRule.pathPattern
              ? inferMatchTypeFromPattern(normalizedRule.pathPattern)
              : normalizedRule.matchType ?? 'EXACT',
          enableAdvancedMatching:
            rule.enableAdvancedMatching ?? hasAdvancedMatchingConfigured(normalizedRule),
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

const getRuleValidationSignature = (rule: ContentTypeRule) => {
  if (!rule.contentTypeId) {
    return null;
  }

  if (rule.enableAdvancedMatching) {
    return JSON.stringify({
      contentTypeId: rule.contentTypeId,
      slugField: rule.slugField || '',
      enableAdvancedMatching: true,
      pathPattern: rule.pathPattern?.trim() ?? '',
      additionalFieldIds: [...(rule.additionalFieldIds ?? [])].sort(),
      matchDimension: rule.matchDimension ?? 'unifiedPagePathScreen',
      matchType: inferMatchTypeFromPattern(rule.pathPattern ?? ''),
    });
  }

  if (!rule.slugField) {
    return null;
  }

  return JSON.stringify({
    contentTypeId: rule.contentTypeId,
    slugField: rule.slugField,
    enableAdvancedMatching: false,
    urlPrefix: rule.urlPrefix?.trim() ?? '',
  });
};

export const getDuplicateRuleIds = (contentTypeRules: ContentTypeRules) => {
  const signatureToRuleIds = new Map<string, string[]>();

  contentTypeRules.forEach((rule) => {
    const signature = getRuleValidationSignature(rule);

    if (!signature) {
      return;
    }

    const existingRuleIds = signatureToRuleIds.get(signature) ?? [];
    signatureToRuleIds.set(signature, [...existingRuleIds, rule.id]);
  });

  return new Set(
    Array.from(signatureToRuleIds.values())
      .filter((ruleIds) => ruleIds.length > 1)
      .flat()
  );
};
