import { useEffect, useMemo, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentEntitySys, SidebarExtensionSDK } from '@contentful/app-sdk';
import { AppInstallationParameters, ContentTypeRule } from 'types';
import { getReportSlug } from 'utils/getReportSlug';

interface ResolvedSidebarRule extends ContentTypeRule {
  reportSlug: string;
  slugFieldValue: string | object;
  slugFieldIsConfigured: boolean;
  contentTypeHasSlugField: boolean;
  contentTypeHasAllFields: boolean;
  isValidRule: boolean;
}

const SLUG_FIELD_INPUT_DELAY = 500;

export const useSidebarRules = (slugFieldRules: ContentTypeRule[]) => {
  const sdk = useSDK<SidebarExtensionSDK>();
  const { forceTrailingSlash } = sdk.parameters.installation as AppInstallationParameters;
  const entryFields = sdk.entry?.fields ?? {};

  const [isPublished, setIsPublished] = useState(false);
  const [haveLoadedPublicationState, setHaveLoadedPublicationState] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string | object>>({});
  const [debouncedFieldValues, setDebouncedFieldValues] = useState<Record<string, string | object>>(
    {}
  );
  const [haveLoadedFieldValues, setHaveLoadedFieldValues] = useState(false);
  const relevantFieldIds = useMemo(
    () =>
      Array.from(
        new Set(
          slugFieldRules
            .flatMap((rule) => [rule.slugField, ...(rule.additionalFieldIds || [])])
            .filter((fieldId) => fieldId)
        )
      ),
    [slugFieldRules]
  );

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
    const initialFieldValues: Record<string, string | object> = {};

    setHaveLoadedFieldValues(false);

    relevantFieldIds.forEach((fieldId) => {
      const fieldApi = (entryFields as Record<string, any>)[fieldId];
      if (!fieldApi) return;

      if (typeof fieldApi.getValue === 'function') {
        initialFieldValues[fieldId] = fieldApi.getValue() ?? '';
      }

      if (typeof fieldApi.onValueChanged === 'function') {
        const detach = fieldApi.onValueChanged((value: string | object) => {
          setFieldValues((prev) => ({ ...prev, [fieldId]: value ?? '' }));
        });
        if (typeof detach === 'function') unsubscribers.push(detach);
      }
    });

    setFieldValues(initialFieldValues);
    setDebouncedFieldValues(initialFieldValues);
    setHaveLoadedFieldValues(true);

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [entryFields, relevantFieldIds]);

  const resolvedRules = useMemo<ResolvedSidebarRule[]>(
    () =>
      slugFieldRules.map((rule) => {
        const slugFieldValue = debouncedFieldValues[rule.slugField] ?? '';
        const slugFieldIsConfigured = Boolean(rule.slugField);
        const contentTypeHasSlugField = rule.slugField in entryFields;
        const additionalFieldIds = rule.additionalFieldIds || [];
        const contentTypeHasAllFields =
          contentTypeHasSlugField && additionalFieldIds.every((fieldId) => fieldId in entryFields);
        const tokenValues = {
          slug: slugFieldValue,
          ...Object.fromEntries(
            additionalFieldIds.map((fieldId) => [fieldId, debouncedFieldValues[fieldId] ?? ''])
          ),
        };
        const isValidRule =
          slugFieldIsConfigured &&
          contentTypeHasAllFields &&
          Object.values(tokenValues).every((value) => Boolean(value)) &&
          isPublished;

        return {
          ...rule,
          slugFieldValue,
          slugFieldIsConfigured,
          contentTypeHasSlugField,
          contentTypeHasAllFields,
          isValidRule,
          reportSlug: getReportSlug(rule, tokenValues, forceTrailingSlash),
        };
      }),
    [debouncedFieldValues, entryFields, forceTrailingSlash, isPublished, slugFieldRules]
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
  };
};
