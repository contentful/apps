import { ContentTypeField } from '@contentful/app-sdk';
import { Accordion, Box, Checkbox, Flex, Note, Text, TextLink } from '@contentful/f36-components';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { useMemo } from 'react';
import { isEntryArrayField, isEntryField } from '../../utils/fieldTypes';
import PreviewFieldRow from './PreviewFieldRow';
import { depthIndent, styles } from './ReferenceEntrySection.styles';
import { ArrowSquareOutIcon } from '@contentful/f36-icons';

interface ReferenceEntrySectionProps {
  entry: EntryProps;
  contentType: ContentTypeProps;
  fieldName: string;
  sourceLocale: string;
  targetLocale: string;
  adoptedFields: Record<string, boolean>;
  onAdoptedFieldChange: (fieldId: string, adopted: boolean) => void;
  onAdoptAllChange: (adopted: boolean) => void;
  isSelfReference: boolean;
  isAlreadyIncluded?: boolean;
  baseUrl: string;
  isDisabled?: boolean;
  depth?: number;
}

const getEntryTitle = (
  entry: EntryProps,
  contentType: ContentTypeProps,
  locale: string
): string => {
  const untitled = 'Untitled';
  const displayFieldId = contentType.displayField;
  if (!displayFieldId) return untitled;

  const value = entry.fields[displayFieldId]?.[locale];
  if (value === undefined || value === null || value === '') {
    return untitled;
  }
  return String(value);
};

const ReferenceEntrySection = ({
  entry,
  contentType,
  fieldName,
  sourceLocale,
  targetLocale,
  adoptedFields,
  onAdoptedFieldChange,
  onAdoptAllChange,
  isSelfReference,
  isAlreadyIncluded = false,
  baseUrl,
  isDisabled = false,
  depth = 1,
}: ReferenceEntrySectionProps) => {
  const localizedFields = useMemo(() => {
    return (contentType.fields as ContentTypeField[]).filter(
      (field) => field.localized && !isEntryField(field) && !isEntryArrayField(field)
    );
  }, [contentType.fields]);

  const fieldCount = localizedFields.length;

  const entryTitle = useMemo(() => {
    return getEntryTitle(entry, contentType, sourceLocale);
  }, [entry, contentType, sourceLocale]);

  const allFieldsAdopted = useMemo(() => {
    return localizedFields.every((field) => adoptedFields[field.id] === true);
  }, [localizedFields, adoptedFields]);

  const getFieldValue = (fieldId: string, locale: string): unknown => {
    return entry.fields[fieldId]?.[locale];
  };

  if (isAlreadyIncluded) {
    return (
      <Box className={`${styles.accordionContainer} ${depthIndent(depth)}`}>
        <Accordion>
          <Accordion.Item
            title={
              <Flex className={styles.accordionHeader}>
                <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
                  {fieldName}: {entryTitle}
                </Text>
              </Flex>
            }>
            <Note variant="neutral" className={styles.noteNeutral}>
              This entry is already included above and will be updated once.
            </Note>
          </Accordion.Item>
        </Accordion>
      </Box>
    );
  }

  if (isSelfReference) {
    return (
      <Box marginTop="spacingM" className={`${styles.accordionContainer} ${depthIndent(depth)}`}>
        <Accordion>
          <Accordion.Item
            title={
              <Flex className={styles.accordionHeader}>
                <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
                  {fieldName}: {entryTitle}
                </Text>
              </Flex>
            }>
            <Note variant="warning" className={styles.noteWarning}>
              This entry references itself. To avoid circular updates, fields from self-referencing
              entries are not displayed.
            </Note>
          </Accordion.Item>
        </Accordion>
      </Box>
    );
  }

  if (fieldCount === 0) {
    return (
      <Box className={`${styles.accordionContainer} ${depthIndent(depth)}`}>
        <Accordion>
          <Accordion.Item
            title={
              <Flex className={styles.accordionHeader}>
                <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
                  {fieldName}: {entryTitle}
                </Text>
              </Flex>
            }>
            <Note variant="warning" className={styles.noteWarning}>
              This entry has no localized fields.
            </Note>
          </Accordion.Item>
        </Accordion>
      </Box>
    );
  }

  return (
    <Box className={`${styles.accordionContainer} ${depthIndent(depth)}`}>
      <Accordion>
        <Accordion.Item
          title={
            <Flex
              alignItems="center"
              justifyContent="space-between"
              className={styles.accordionHeader}>
              <TextLink
                href={`${baseUrl}/entries/${entry.sys.id}`}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ArrowSquareOutIcon variant="muted" size="tiny" />}
                alignIcon="end">
                <Text fontSize="fontSizeM" fontColor="blue600" fontWeight="fontWeightDemiBold">
                  {fieldName}: {entryTitle}
                </Text>
              </TextLink>
              <Text fontColor="gray600" fontSize="fontSizeS">
                {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
              </Text>
            </Flex>
          }>
          <Box>
            <Flex justifyContent="end" alignItems="center" marginBottom="spacingM">
              <Checkbox
                isChecked={allFieldsAdopted}
                onChange={(e) => onAdoptAllChange(e.target.checked)}
                isDisabled={isDisabled}>
                Adopt all fields
              </Checkbox>
            </Flex>

            <Flex flexDirection="column" gap="spacingS">
              {localizedFields.map((field) => (
                <PreviewFieldRow
                  key={field.id}
                  field={field}
                  sourceValue={getFieldValue(field.id, sourceLocale)}
                  targetValue={getFieldValue(field.id, targetLocale)}
                  sourceLocale={sourceLocale}
                  targetLocale={targetLocale}
                  isAdopted={adoptedFields[field.id] ?? true}
                  onAdoptedChange={(adopted) => onAdoptedFieldChange(field.id, adopted)}
                  isDisabled={isDisabled}
                />
              ))}
            </Flex>
          </Box>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
};

export default ReferenceEntrySection;
