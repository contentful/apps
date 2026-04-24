import React, { useEffect, useMemo, useState } from 'react';
import { Button, Flex, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { PageAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps, Entry } from 'contentful-management';
import type { ContentTypeField, EntryLinkValue } from '../types';
import { getEntryLinkIds, getEntryTitle, getReferenceDisplayValue } from '../utils/entryUtils';
import { API_LIMITS } from '../utils/constants';

interface ReferenceFieldEditorProps {
  field: ContentTypeField;
  value: EntryLinkValue | EntryLinkValue[] | null | undefined;
  onChange: (value: EntryLinkValue | EntryLinkValue[] | null) => void;
  contentTypes?: ContentTypeProps[];
  defaultLocale?: string;
}

const createEntryLinkValue = (entryId: string): EntryLinkValue => ({
  sys: {
    type: 'Link',
    linkType: 'Entry',
    id: entryId,
  },
});

const getLinkContentTypes = (field: ContentTypeField): string[] | undefined => {
  const validations = [...(field.validations || []), ...(field.items?.validations || [])];
  const linkContentTypeValidation = validations.find(
    (validation) => validation.linkContentType && Array.isArray(validation.linkContentType)
  );

  return linkContentTypeValidation?.linkContentType;
};

const isEntryReferenceField = (field: ContentTypeField) =>
  (field.type === 'Link' &&
    (field.fieldControl?.widgetId === 'entryLinkEditor' ||
      field.validations.some((validation) => Array.isArray(validation.linkContentType)))) ||
  (field.type === 'Array' && field.items?.type === 'Link' && field.items?.linkType === 'Entry');

export const ReferenceFieldEditor: React.FC<ReferenceFieldEditorProps> = ({
  field,
  value,
  onChange,
  contentTypes = [],
  defaultLocale,
}) => {
  const sdk = useSDK<PageAppSDK>();
  const locale = defaultLocale || sdk.locales.default;
  const [selectionLabel, setSelectionLabel] = useState<string>('');
  const [referenceDisplayValues, setReferenceDisplayValues] = useState<Record<string, string>>({});
  const allowedContentTypes = useMemo(() => getLinkContentTypes(field), [field]);
  const isMultiReferenceField =
    field.type === 'Array' && field.items?.type === 'Link' && field.items?.linkType === 'Entry';

  useEffect(() => {
    const referenceIds = getEntryLinkIds(value);

    if (referenceIds.length === 0) {
      setReferenceDisplayValues({});
      return;
    }

    let isMounted = true;
    const contentTypeMap = new Map(contentTypes.map((ct) => [ct.sys.id, ct]));

    const loadReferenceTitles = async () => {
      try {
        const linkedEntries: Entry[] = [];

        for (let i = 0; i < referenceIds.length; i += API_LIMITS.CORS_QUERY_PARAM_LIMIT) {
          const chunk = referenceIds.slice(i, i + API_LIMITS.CORS_QUERY_PARAM_LIMIT);
          const response = await sdk.cma.entry.getMany({
            spaceId: sdk.ids.space,
            environmentId: sdk.ids.environment,
            query: { 'sys.id[in]': chunk.join(','), limit: chunk.length },
          });
          linkedEntries.push(...((response.items as Entry[]) || []));
        }

        if (!isMounted) {
          return;
        }

        const labels = Object.fromEntries(
          linkedEntries.map((entry) => {
            const ct = contentTypeMap.get(entry.sys.contentType.sys.id);
            const label = ct ? getEntryTitle(entry as any, ct, locale) : entry.sys.id;
            return [entry.sys.id, label];
          })
        );

        setReferenceDisplayValues(labels);
      } catch {
        if (isMounted) {
          setReferenceDisplayValues({});
        }
      }
    };

    void loadReferenceTitles();

    return () => {
      isMounted = false;
    };
  }, [sdk, value, contentTypes, locale]);

  if (!isEntryReferenceField(field)) {
    return null;
  }

  const getCurrentSelectionSummary = () => {
    if (selectionLabel) {
      return selectionLabel;
    }

    const existingSelectionSummary = getReferenceDisplayValue(value, referenceDisplayValues);
    if (existingSelectionSummary) {
      return existingSelectionSummary;
    }

    return 'No content selected';
  };

  const getLabel = (entry: Entry): string => {
    const ctId = entry.sys.contentType?.sys?.id;
    const ct = ctId ? contentTypeMap.get(ctId) : undefined;
    if (ct) {
      return getEntryTitle(entry as any, ct, locale);
    }
    // Fallback: use the first non-empty string field value
    const firstField = Object.values(entry.fields || {}).find(
      (v) => v && typeof v === 'object' && Object.keys(v).length > 0
    ) as Record<string, unknown> | undefined;
    const firstValue = firstField ? Object.values(firstField)[0] : undefined;
    return typeof firstValue === 'string' && firstValue.trim() !== '' ? firstValue : entry.sys.id;
  };

  const contentTypeMap = new Map(contentTypes.map((ct) => [ct.sys.id, ct]));

  const selectSingleEntry = async () => {
    const entry = (await sdk.dialogs.selectSingleEntry({
      locale,
      ...(allowedContentTypes && allowedContentTypes.length > 0
        ? { contentTypes: allowedContentTypes }
        : {}),
    })) as Entry | null;

    if (!entry) {
      return;
    }

    setSelectionLabel(getLabel(entry));
    onChange(createEntryLinkValue(entry.sys.id));
  };

  const selectMultipleEntries = async () => {
    const entries = (await sdk.dialogs.selectMultipleEntries({
      locale,
      ...(allowedContentTypes && allowedContentTypes.length > 0
        ? { contentTypes: allowedContentTypes }
        : {}),
    })) as Entry[] | null;

    if (!entries || entries.length === 0) {
      return;
    }

    const entryLabels = entries.map(getLabel);
    setSelectionLabel(
      entryLabels.length === 1 ? entryLabels[0] : `${entryLabels.length} entries selected`
    );
    onChange(entries.map((entry) => createEntryLinkValue(entry.sys.id)));
  };

  const clearSelection = () => {
    setSelectionLabel('');
    onChange(isMultiReferenceField ? [] : null);
  };

  return (
    <Flex flexDirection="column" gap="spacingS">
      <Flex gap="spacingS" alignItems="center">
        <Button
          variant="secondary"
          onClick={() =>
            void (isMultiReferenceField ? selectMultipleEntries() : selectSingleEntry())
          }
          testId="reference-picker-trigger">
          Add existing content
        </Button>
        <Button
          variant="transparent"
          isDisabled={Array.isArray(value) ? value.length === 0 : !value}
          onClick={clearSelection}
          testId="reference-picker-clear">
          Clear selection
        </Button>
      </Flex>
      <Text fontColor="gray700" testId="reference-picker-selection">
        {getCurrentSelectionSummary()}
      </Text>
    </Flex>
  );
};
