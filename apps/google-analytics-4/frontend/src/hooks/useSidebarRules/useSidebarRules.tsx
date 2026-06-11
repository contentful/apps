import { useEffect, useMemo, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import {
  ContentEntitySys,
  EditorLocaleSettings,
  LocalesAPI,
  SidebarExtensionSDK,
} from '@contentful/app-sdk';
import { AppInstallationParameters, ContentTypeRule, LocaleOption } from 'types';
import {
  getContentTypeValuePathPatterns,
  getPatternTokens,
  inferMatchTypeFromPattern,
  isLocalizedPathPatternsEnabled,
} from 'utils/contentTypeMatching';
import { getLocalizedPathPattern, getReportSlug } from 'utils/getReportSlug';

interface ResolvedSidebarRule extends ContentTypeRule {
  reportSlug: string;
  slugFieldValue: string | number | object;
  slugFieldIsConfigured: boolean;
  contentTypeHasSlugField: boolean;
  contentTypeHasAllFields: boolean;
  isValidRule: boolean;
}

const SLUG_FIELD_INPUT_DELAY = 500;
const LOCALE_PATTERN_TOKEN = 'locale';
const SLUG_PATTERN_TOKEN = 'slug';
const RESERVED_PATTERN_TOKENS = new Set([LOCALE_PATTERN_TOKEN, SLUG_PATTERN_TOKEN]);

const getPatternFieldTokens = (rule: ContentTypeRule) =>
  rule.enableAdvancedMatching
    ? Array.from(
        new Set(
          getContentTypeValuePathPatterns(rule)
            .flatMap((pathPattern) => getPatternTokens(pathPattern))
            .filter((token) => !RESERVED_PATTERN_TOKENS.has(token))
        )
      )
    : [];

const getSortedLocaleOptions = (locales?: LocalesAPI): LocaleOption[] =>
  [...(locales?.available || [])]
    .map((code) => ({
      code,
      label: locales?.names?.[code] ? `${locales.names[code]} (${code})` : code,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

const getPreferredLocale = (
  localeSettings: EditorLocaleSettings | undefined,
  locales?: LocalesAPI
) => {
  const availableLocales = locales?.available || [];
  const availableLocaleSet = new Set(availableLocales);
  const candidateLocales = [
    localeSettings?.focused,
    ...(localeSettings?.active || []),
    locales?.default,
    ...availableLocales,
  ].filter((locale): locale is string => Boolean(locale));

  return (
    candidateLocales.find(
      (locale) => availableLocaleSet.size === 0 || availableLocaleSet.has(locale)
    ) || ''
  );
};

const readFieldValue = (fieldApi: any, selectedLocale: string) => {
  const hasSelectedLocale =
    selectedLocale && Array.isArray(fieldApi.locales) && fieldApi.locales.includes(selectedLocale);

  if (hasSelectedLocale) {
    return fieldApi.getValue(selectedLocale) ?? '';
  }

  return fieldApi.getValue() ?? '';
};

const onFieldValueChanged = (
  fieldApi: any,
  selectedLocale: string,
  callback: (value: string | number | object) => void
) => {
  const hasSelectedLocale =
    selectedLocale && Array.isArray(fieldApi.locales) && fieldApi.locales.includes(selectedLocale);

  if (hasSelectedLocale) {
    return fieldApi.onValueChanged(selectedLocale, callback);
  }

  return fieldApi.onValueChanged(callback);
};

export const useSidebarRules = (slugFieldRules: ContentTypeRule[]) => {
  const sdk = useSDK<SidebarExtensionSDK>();
  const { forceTrailingSlash } = sdk.parameters.installation as AppInstallationParameters;
  const entryFields = sdk.entry?.fields ?? {};
  const localeOptions = useMemo(() => getSortedLocaleOptions(sdk.locales), [sdk.locales]);
  const [selectedLocale, setSelectedLocale] = useState(() =>
    getPreferredLocale(sdk.editor?.getLocaleSettings?.(), sdk.locales)
  );

  const [isPublished, setIsPublished] = useState(false);
  const [haveLoadedPublicationState, setHaveLoadedPublicationState] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string | number | object>>({});
  const [debouncedFieldValues, setDebouncedFieldValues] = useState<
    Record<string, string | number | object>
  >({});
  const [haveLoadedFieldValues, setHaveLoadedFieldValues] = useState(false);
  const usesLocaleToken = useMemo(
    () =>
      slugFieldRules.some(
        (rule) =>
          rule.enableAdvancedMatching &&
          (isLocalizedPathPatternsEnabled(rule) ||
            getContentTypeValuePathPatterns(rule).some((pathPattern) =>
              getPatternTokens(pathPattern).includes(LOCALE_PATTERN_TOKEN)
            ))
      ),
    [slugFieldRules]
  );
  const relevantFieldIds = useMemo(
    () =>
      Array.from(
        new Set(
          slugFieldRules
            .flatMap((rule) => {
              const patternTokens = rule.enableAdvancedMatching
                ? getContentTypeValuePathPatterns(rule).flatMap((pathPattern) =>
                    getPatternTokens(pathPattern)
                  )
                : [];
              const usesSlugToken =
                !rule.enableAdvancedMatching || patternTokens.includes(SLUG_PATTERN_TOKEN);

              return [
                usesSlugToken ? rule.slugField : '',
                ...(rule.additionalFieldIds || []),
                ...getPatternFieldTokens(rule),
              ];
            })
            .filter((fieldId) => fieldId)
        )
      ),
    [slugFieldRules]
  );

  useEffect(() => {
    if (!sdk.editor?.onLocaleSettingsChanged) {
      const fallbackLocale = getPreferredLocale(sdk.editor?.getLocaleSettings?.(), sdk.locales);
      if (fallbackLocale) setSelectedLocale(fallbackLocale);
      return;
    }

    return sdk.editor.onLocaleSettingsChanged((localeSettings) => {
      const nextLocale = getPreferredLocale(localeSettings, sdk.locales);
      if (nextLocale) setSelectedLocale(nextLocale);
    });
  }, [sdk.editor, sdk.locales]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFieldValues(fieldValues), SLUG_FIELD_INPUT_DELAY);
    return () => clearTimeout(timeout);
  }, [fieldValues]);

  useEffect(() => {
    const handlePublishedStatus = (sys: ContentEntitySys) => {
      setIsPublished(Boolean(sys.publishedAt));
      setHaveLoadedPublicationState(true);
    };

    if (!sdk.entry?.onSysChanged) {
      setHaveLoadedPublicationState(true);
      return;
    }
    return sdk.entry.onSysChanged((sys) => handlePublishedStatus(sys));
  }, [sdk.entry]);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];
    const initialFieldValues: Record<string, string | number | object> = {};

    setHaveLoadedFieldValues(false);

    relevantFieldIds.forEach((fieldId) => {
      const fieldApi = (entryFields as Record<string, any>)[fieldId];
      if (!fieldApi) return;

      if (typeof fieldApi.getValue === 'function') {
        initialFieldValues[fieldId] = readFieldValue(fieldApi, selectedLocale);
      }

      if (typeof fieldApi.onValueChanged === 'function') {
        const detach = onFieldValueChanged(fieldApi, selectedLocale, (value) => {
          setFieldValues((prev) => ({ ...prev, [fieldId]: value ?? '' }));
        });
        if (typeof detach === 'function') unsubscribers.push(detach);
      }
    });

    setFieldValues(initialFieldValues);
    setDebouncedFieldValues(initialFieldValues);
    setHaveLoadedFieldValues(true);

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [entryFields, relevantFieldIds, selectedLocale]);

  const resolvedRules = useMemo<ResolvedSidebarRule[]>(
    () =>
      slugFieldRules.map((rule) => {
        const activePathPattern = getLocalizedPathPattern(rule, selectedLocale);
        const patternTokens = rule.enableAdvancedMatching
          ? getPatternTokens(activePathPattern)
          : [];
        const requiresSlugField =
          !rule.enableAdvancedMatching || patternTokens.includes(SLUG_PATTERN_TOKEN);
        const slugFieldValue = requiresSlugField ? debouncedFieldValues[rule.slugField] ?? '' : '';
        const slugFieldIsConfigured = Boolean(rule.slugField);
        const contentTypeHasSlugField =
          !requiresSlugField || !rule.slugField || rule.slugField in entryFields;
        const additionalFieldIds = rule.additionalFieldIds || [];
        const requiredFieldIds = new Set(additionalFieldIds);

        if (!rule.enableAdvancedMatching && rule.slugField) {
          requiredFieldIds.add(rule.slugField);
        }

        const contentTypeHasAllFields =
          contentTypeHasSlugField &&
          Array.from(requiredFieldIds).every((fieldId) => fieldId in entryFields);
        const tokenValues = Object.fromEntries(
          Array.from(requiredFieldIds).map((fieldId) => [
            fieldId,
            debouncedFieldValues[fieldId] ?? '',
          ])
        ) as Record<string, string | number | object>;

        tokenValues.locale = selectedLocale;

        if (rule.slugField && !('slug' in tokenValues)) {
          tokenValues.slug = slugFieldValue;
        }

        const requiredTokenValues = rule.enableAdvancedMatching
          ? patternTokens.map((token) => tokenValues[token as keyof typeof tokenValues] ?? '')
          : [slugFieldValue];
        const hasAllRequiredTokenValues = requiredTokenValues.every(
          (value) => value !== undefined && value !== null && value !== ''
        );
        const isValidRule = rule.enableAdvancedMatching
          ? contentTypeHasAllFields && hasAllRequiredTokenValues && isPublished
          : slugFieldIsConfigured &&
            contentTypeHasAllFields &&
            hasAllRequiredTokenValues &&
            isPublished;

        return {
          ...rule,
          slugFieldValue,
          slugFieldIsConfigured,
          contentTypeHasSlugField,
          contentTypeHasAllFields,
          isValidRule,
          matchType: rule.enableAdvancedMatching
            ? inferMatchTypeFromPattern(activePathPattern)
            : rule.matchType,
          reportSlug: getReportSlug(rule, tokenValues, forceTrailingSlash, selectedLocale),
        };
      }),
    [
      debouncedFieldValues,
      entryFields,
      forceTrailingSlash,
      isPublished,
      selectedLocale,
      slugFieldRules,
    ]
  );

  const validRules = useMemo(
    () => resolvedRules.filter((rule) => rule.isValidRule),
    [resolvedRules]
  );
  const fallbackRule = resolvedRules[0];
  const summaryLabel = useMemo(
    () =>
      validRules.length <= 1
        ? validRules[0]?.reportSlug || fallbackRule?.reportSlug || ''
        : `${validRules.length} rules configured`,
    [fallbackRule?.reportSlug, validRules]
  );

  return {
    isPublished,
    haveLoadedFieldValues,
    haveLoadedPublicationState,
    resolvedRules,
    validRules,
    summaryLabel,
    isContentTypeWarning: validRules.length === 0,
    warningRule: fallbackRule,
    localeOptions: usesLocaleToken ? localeOptions : [],
    selectedLocale,
    handleLocaleChange: setSelectedLocale,
  };
};
