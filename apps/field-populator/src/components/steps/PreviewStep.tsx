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
import { useMemo, useState } from 'react';
import { SimplifiedLocale } from '../../utils/locales';
import PreviewBox from '../preview/PreviewBox';
import PreviewFieldRow from '../preview/PreviewFieldRow';
import { styles } from './PreviewStep.styles';

interface PreviewStepProps {
  entry: EntryProps;
  contentType: ContentTypeProps;
  sourceLocale: string;
  targetLocales: SimplifiedLocale[];
  adoptedFields: Record<string, boolean>;
  onAdoptedFieldsChange: (adoptedFields: Record<string, boolean>) => void;
  availableLocales: SimplifiedLocale[];
  isDisabled?: boolean;
}

const PreviewStepComponent = ({
  entry,
  contentType,
  sourceLocale,
  targetLocales,
  adoptedFields,
  onAdoptedFieldsChange,
  availableLocales,
  isDisabled = false,
}: PreviewStepProps) => {
  const [selectedTargetLocale, setSelectedTargetLocale] = useState<string>(
    targetLocales[0]?.code || ''
  );

  const sourceLocaleName = useMemo(() => {
    const locale = availableLocales.find((l) => l.code === sourceLocale);
    return locale?.name || sourceLocale;
  }, [availableLocales, sourceLocale]);

  const localizableFields = useMemo(() => {
    return (contentType.fields as ContentTypeField[]).filter((field) => field.localized);
  }, [contentType.fields]);

  const allFieldsAdopted = useMemo(() => {
    return localizableFields.every((field) => adoptedFields[field.id] === true);
  }, [localizableFields, adoptedFields]);

  const handleAdoptAllChange = (checked: boolean) => {
    const newAdoptedFields: Record<string, boolean> = {};
    localizableFields.forEach((field) => {
      newAdoptedFields[field.id] = checked;
    });
    onAdoptedFieldsChange(newAdoptedFields);
  };

  const handleFieldAdoptedChange = (fieldId: string, adopted: boolean) => {
    onAdoptedFieldsChange({
      ...adoptedFields,
      [fieldId]: adopted,
    });
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
            onChange={(e) => handleAdoptAllChange(e.target.checked)}
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

        {/* Field Rows */}
        <Box>
          {localizableFields.map((field) => (
            <Box
              key={field.id}
              marginBottom="spacingM"
              paddingLeft="spacingM"
              paddingRight="spacingM"
              className={styles.fieldBox}>
              <PreviewFieldRow
                field={field}
                sourceValue={getFieldValue(field.id, sourceLocale)}
                targetValue={getFieldValue(field.id, selectedTargetLocale)}
                sourceLocale={sourceLocale}
                targetLocale={selectedTargetLocale}
                isAdopted={adoptedFields[field.id] ?? true}
                onAdoptedChange={(adopted) => handleFieldAdoptedChange(field.id, adopted)}
                isDisabled={isDisabled}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Flex>
  );
};

export default PreviewStepComponent;
