import React, { useEffect, useMemo, useState } from 'react';
import { Button, Flex, Text } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { PageAppSDK } from '@contentful/app-sdk';
import type { Entry } from 'contentful-management';
import type { ContentTypeField, EntryLinkValue } from '../types';
import { getEntryLinkIds, getReferenceDisplayValue } from '../utils/entryUtils';

interface ReferenceFieldEditorProps {
  field: ContentTypeField;
  value: EntryLinkValue | EntryLinkValue[] | null | undefined;
  onChange: (value: EntryLinkValue | EntryLinkValue[] | null) => void;
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

const getEntryDisplayLabel = (entry: Entry): string => {
  const firstField = Object.values(entry.fields || {}).find(
    (localizedFieldValue) =>
      localizedFieldValue && typeof localizedFieldValue === 'object' && Object.keys(localizedFieldValue).length > 0
  ) as Record<string, unknown> | undefined;

  const firstLocalizedValue = firstField ? Object.values(firstField)[0] : undefined;
  return typeof firstLocalizedValue === 'string' && firstLocalizedValue.trim() !== ''
    ? firstLocalizedValue
    : entry.sys.id;
};

export const ReferenceFieldEditor: React.FC<ReferenceFieldEditorProps> = ({
  field,
  value,
  onChange,
}) => {
  const sdk = useSDK<PageAppSDK>();
  const [selectionLabel, setSelectionLabel] = useState<string>('');
  const [referenceDisplayValues, setReferenceDisplayValues] = useState<Record<string, string>>({});
  const allowedContentTypes = useMemo(() => getLinkContentTypes(field), [field]);
  const isMultiReferenceField =
    field.type === 'Array' &&
    field.items?.type === 'Link' &&
    field.items?.linkType === 'Entry';

  useEffect(() => {
    const referenceIds = getEntryLinkIds(value);

    if (referenceIds.length === 0) {
      setReferenceDisplayValues({});
      return;
    }

    let isMounted = true;

    const loadReferenceTitles = async () => {
      const entries = await Promise.all(
        referenceIds.map(async (entryId) => {
          try {
            const entry = await sdk.cma.entry.get({
              spaceId: sdk.ids.space,
              environmentId: sdk.ids.environment,
              entryId,
            });

            return entry || null;
          } catch {
            return null;
          }
        })
      );

      if (!isMounted) {
        return;
      }

      const labels = entries.reduce<Record<string, string>>((acc, entry, index) => {
        if (entry) {
          acc[referenceIds[index]] = getEntryDisplayLabel(entry as Entry);
        }

        return acc;
      }, {});

      setReferenceDisplayValues(labels);
    };

    void loadReferenceTitles();

    return () => {
      isMounted = false;
    };
  }, [sdk, value]);

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

  const selectSingleEntry = async () => {
    const entry = (await sdk.dialogs.selectSingleEntry({
      locale: sdk.locales.default,
      ...(allowedContentTypes && allowedContentTypes.length > 0
        ? { contentTypes: allowedContentTypes }
        : {}),
    })) as Entry | null;

    if (!entry) {
      return;
    }

    setSelectionLabel(getEntryDisplayLabel(entry));
    onChange(createEntryLinkValue(entry.sys.id));
  };

  const selectMultipleEntries = async () => {
    const entries = (await sdk.dialogs.selectMultipleEntries({
      locale: sdk.locales.default,
      ...(allowedContentTypes && allowedContentTypes.length > 0
        ? { contentTypes: allowedContentTypes }
        : {}),
    })) as Entry[] | null;

    if (!entries || entries.length === 0) {
      return;
    }

    const entryLabels = entries.map(getEntryDisplayLabel);
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
          onClick={() => void (isMultiReferenceField ? selectMultipleEntries() : selectSingleEntry())}
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
