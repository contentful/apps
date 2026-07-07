import { ContentTypeRule, ContentTypeRules, ContentTypes, ContentTypeValue } from 'types';
import {
  getLocalizedPathPatternEntries,
  hasAdvancedMatchingConfigured,
  inferMatchTypeFromContentTypeValue,
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
  enableLocalizedPathPatterns: false,
  localizedPathPatterns: {},
  matchDimension: 'unifiedPagePathScreen',
  matchType: 'EXACT',
});

export const createRuleFromContentType = (
  contentTypeId: string,
  value: ContentTypeValue
): ContentTypeRule => {
  const enableLocalizedPathPatterns =
    value.enableLocalizedPathPatterns ??
    getLocalizedPathPatternEntries(value.localizedPathPatterns).length > 0;
  const normalizedValue = { ...value, enableLocalizedPathPatterns };
  const enableAdvancedMatching = hasAdvancedMatchingConfigured(normalizedValue);

  return {
    id: createRuleId(),
    contentTypeId,
    slugField: value.slugField,
    urlPrefix: value.urlPrefix,
    additionalFieldIds: value.additionalFieldIds || [],
    enableAdvancedMatching,
    pathPattern: value.pathPattern || '',
    enableLocalizedPathPatterns,
    localizedPathPatterns: value.localizedPathPatterns || {},
    matchDimension: value.matchDimension || 'unifiedPagePathScreen',
    matchType: enableAdvancedMatching
      ? inferMatchTypeFromContentTypeValue(normalizedValue)
      : value.matchType || 'EXACT',
  };
};

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
        const enableLocalizedPathPatterns =
          rule.enableLocalizedPathPatterns ??
          getLocalizedPathPatternEntries(rule.localizedPathPatterns).length > 0;
        const normalizedRule = {
          ...createDefaultRule(rule.contentTypeId),
          ...rule,
          enableLocalizedPathPatterns,
        };
        const enableAdvancedMatching =
          rule.enableAdvancedMatching ?? hasAdvancedMatchingConfigured(normalizedRule);

        return {
          ...normalizedRule,
          matchType: enableAdvancedMatching
            ? inferMatchTypeFromContentTypeValue(normalizedRule)
            : normalizedRule.matchType ?? 'EXACT',
          enableAdvancedMatching,
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
      enableLocalizedPathPatterns: Boolean(rule.enableLocalizedPathPatterns),
      localizedPathPatterns: Object.fromEntries(
        Object.entries(rule.localizedPathPatterns ?? {})
          .filter(([, pathPattern]) => pathPattern.trim())
          .sort(([leftLocale], [rightLocale]) => leftLocale.localeCompare(rightLocale))
      ),
      additionalFieldIds: [...(rule.additionalFieldIds ?? [])].sort(),
      matchDimension: rule.matchDimension ?? 'unifiedPagePathScreen',
      matchType: inferMatchTypeFromContentTypeValue(rule),
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
