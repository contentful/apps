import { ContentTypeField } from '@contentful/app-sdk';
import {
  Box,
  Caption,
  Checkbox,
  Flex,
  FormControl,
  List,
  Paragraph,
  Select,
  Subheading,
  Text,
  TextInput,
} from '@contentful/f36-components';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { useEffect, useMemo, useState } from 'react';
import {
  AdoptedFieldsMap,
  ReferencedEntryData,
  setAllEntryFieldsAdopted,
  setFieldAdopted,
} from '../../utils/adoptedFields';
import { isEntryArrayField, isEntryField } from '../../utils/fieldTypes';
import { SimplifiedLocale } from '../../utils/locales';
import PreviewBox from '../preview/PreviewBox';
import PreviewFieldRow from '../preview/PreviewFieldRow';
import ReferenceEntrySection from '../preview/ReferenceEntrySection';
import { styles } from './PreviewStep.styles';

function initializeAdoptedFields(
  entryId: string,
  contentType: ContentTypeProps,
  referencedEntries: ReferencedEntryData[]
): AdoptedFieldsMap {
  const initialAdoptedFields: AdoptedFieldsMap = {};

  const mainEntryFields: Record<string, boolean> = {};
  (contentType.fields as ContentTypeField[])
    .filter((field) => field.localized)
    .forEach((field) => {
      mainEntryFields[field.id] = true;
    });
  initialAdoptedFields[entryId] = mainEntryFields;

  for (const referenceEntryData of referencedEntries) {
    if (referenceEntryData.isSelfReference) {
      continue;
    }

    const referenceEntryId = referenceEntryData.entry.sys.id;
    if (initialAdoptedFields[referenceEntryId]) {
      // Same entry is referenced more than once, skip it from the second time
      continue;
    }

    const referencedEntryFields: Record<string, boolean> = {};
    (referenceEntryData.contentType.fields as ContentTypeField[])
      .filter((f) => f.localized)
      .forEach((f) => {
        referencedEntryFields[f.id] = true;
      });
    initialAdoptedFields[referenceEntryId] = referencedEntryFields;
  }

  return initialAdoptedFields;
}

interface PreviewStepProps {
  entry: EntryProps;
  contentType: ContentTypeProps;
  referencedEntries: ReferencedEntryData[];
  sourceLocale: string;
  targetLocales: SimplifiedLocale[];
  adoptedFields: AdoptedFieldsMap;
  onAdoptedFieldsChange: (adoptedFields: AdoptedFieldsMap) => void;
  availableLocales: SimplifiedLocale[];
  baseUrl: string;
  isDisabled?: boolean;
}

const PreviewStepComponent = ({
  entry,
  contentType,
  referencedEntries,
  sourceLocale,
  targetLocales,
  adoptedFields,
  onAdoptedFieldsChange,
  availableLocales,
  baseUrl,
  isDisabled = false,
}: PreviewStepProps) => {
  const [selectedTargetLocale, setSelectedTargetLocale] = useState<string>(
    targetLocales[0]?.code || ''
  );

  useEffect(() => {
    if (Object.keys(adoptedFields).length === 0) {
      onAdoptedFieldsChange(initializeAdoptedFields(entry.sys.id, contentType, referencedEntries));
    }
  }, [entry.sys.id, contentType, referencedEntries, adoptedFields, onAdoptedFieldsChange]);

  const sourceLocaleName = useMemo(() => {
    const locale = availableLocales.find((l) => l.code === sourceLocale);
    return locale?.name || sourceLocale;
  }, [availableLocales, sourceLocale]);

  const localizedFields = useMemo(() => {
    return (contentType.fields as ContentTypeField[]).filter(
      (field) => field.localized && !isEntryField(field) && !isEntryArrayField(field)
    );
  }, [contentType.fields]);

  const allFieldsAdopted = useMemo(() => {
    return localizedFields.every((field) => adoptedFields[entry.sys.id]?.[field.id] === true);
  }, [localizedFields, adoptedFields]);

  const handleAdoptAll = (entryId: string, contentType: ContentTypeProps, adopted: boolean) => {
    const fieldIds = (contentType.fields as ContentTypeField[])
      .filter((f) => f.localized && !isEntryField(f) && !isEntryArrayField(f))
      .map((f) => f.id);
    onAdoptedFieldsChange(setAllEntryFieldsAdopted(adoptedFields, entryId, fieldIds, adopted));
  };

  const handleFieldAdopted = (entryId: string, fieldId: string, adopted: boolean) => {
    onAdoptedFieldsChange(setFieldAdopted(adoptedFields, entryId, fieldId, adopted));
  };

  const getFieldValue = (fieldId: string, locale: string): unknown => {
    return entry.fields[fieldId]?.[locale];
  };

  return (
    <Flex flexDirection="column">
      {/* Locale Summary Section */}
      <Subheading marginBottom="spacing2Xs">Adopt changes</Subheading>
      <Paragraph fontColor="gray700">
        Target locale fields will be populated by the source locale field.
      </Paragraph>
      <PreviewBox>
        <Flex>
          <Flex flexDirection="column" flexGrow={1} flexBasis="0">
            <Caption fontWeight="fontWeightMedium">Source</Caption>
            <Text marginTop="spacing2Xs">{sourceLocaleName}</Text>
          </Flex>
          <Flex flexDirection="column" flexGrow={1} flexBasis="0" marginLeft="spacingM">
            <Caption fontWeight="fontWeightMedium">Target</Caption>
            <List className={styles.localeList}>
              {targetLocales.map((locale) => (
                <List.Item key={locale.code}>
                  <Text fontColor="gray700">{locale.name}</Text>
                </List.Item>
              ))}
            </List>
          </Flex>
        </Flex>
      </PreviewBox>

      {/* Preview Section */}
      <Box
        marginTop="spacingXl"
        marginBottom="spacingM"
        padding="spacingM"
        className={styles.previewSection}>
        <Flex justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Subheading marginBottom="spacing2Xs">Preview changes</Subheading>
            <Paragraph fontColor="gray700">
              Preview how fields will adopt the content. You can switch between different source and
              target locales.
            </Paragraph>
          </Box>
          <Checkbox
            isChecked={allFieldsAdopted}
            onChange={(e) => handleAdoptAll(entry.sys.id, contentType, e.target.checked)}
            isDisabled={isDisabled}>
            Adopt all fields
          </Checkbox>
        </Flex>

        {/* Locale Selectors */}
        <Flex gap="spacingM" marginTop="spacingM">
          <Flex flexGrow={1} flexBasis="0">
            <FormControl style={{ width: '100%' }}>
              <FormControl.Label>Source locale</FormControl.Label>
              <TextInput
                id="preview-source-locale"
                name="preview-source-locale"
                value={sourceLocaleName}
                isDisabled></TextInput>
            </FormControl>
          </Flex>
          <Flex flexGrow={1} flexBasis="0">
            <FormControl style={{ width: '100%' }}>
              <FormControl.Label>Target locale</FormControl.Label>
              <Select
                id="preview-target-locale"
                name="preview-target-locale"
                value={selectedTargetLocale}
                onChange={(e) => setSelectedTargetLocale(e.target.value)}>
                {targetLocales.map((locale) => (
                  <Select.Option key={locale.code} value={locale.code}>
                    {locale.name}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          </Flex>
        </Flex>

        {/* Field rows */}
        <Flex flexDirection="column" gap="spacingS">
          {(contentType.fields as ContentTypeField[]).map((field) => {
            if (isEntryField(field) || isEntryArrayField(field)) {
              const fieldReferences = referencedEntries.filter(
                (referenceData) => referenceData.fieldId === field.id
              );
              return fieldReferences.map((referenceData) => (
                <ReferenceEntrySection
                  key={`${referenceData.fieldId}-${referenceData.entry.sys.id}`}
                  entry={referenceData.entry}
                  contentType={referenceData.contentType}
                  fieldName={referenceData.fieldName}
                  sourceLocale={sourceLocale}
                  targetLocale={selectedTargetLocale}
                  adoptedFields={adoptedFields[referenceData.entry.sys.id] || {}}
                  onAdoptedFieldChange={(fieldId, adopted) =>
                    handleFieldAdopted(referenceData.entry.sys.id, fieldId, adopted)
                  }
                  onAdoptAllChange={(adopted) =>
                    handleAdoptAll(referenceData.entry.sys.id, referenceData.contentType, adopted)
                  }
                  isSelfReference={referenceData.isSelfReference}
                  isDisabled={isDisabled}
                  baseUrl={baseUrl}
                />
              ));
            }

            if (field.localized) {
              return (
                <PreviewFieldRow
                  key={field.id}
                  field={field}
                  sourceValue={getFieldValue(field.id, sourceLocale)}
                  targetValue={getFieldValue(field.id, selectedTargetLocale)}
                  sourceLocale={sourceLocale}
                  targetLocale={selectedTargetLocale}
                  isAdopted={adoptedFields[entry.sys.id]?.[field.id] ?? true}
                  onAdoptedChange={(adopted) => handleFieldAdopted(entry.sys.id, field.id, adopted)}
                  isDisabled={isDisabled}
                />
              );
            }

            // Non-localized, non-reference fields are not displayed
            return null;
          })}
        </Flex>
      </Box>
    </Flex>
  );
};

export default PreviewStepComponent;
