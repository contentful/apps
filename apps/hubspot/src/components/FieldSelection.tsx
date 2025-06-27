import { Box, Checkbox, Paragraph, Text } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { useMemo } from 'react';
import { SdkField } from '../utils';
import { styles } from './FieldSelection.styles';

type FieldsSelectionProps = {
  fields: SdkField[];
  selectedFields: string[];
  setSelectedFields: React.Dispatch<React.SetStateAction<string[]>>;
};

const FieldSelection = (props: FieldsSelectionProps) => {
  const { fields, selectedFields, setSelectedFields } = props;
  const supportedFields = fields.filter((field) => field.supported);

  const allSelected = useMemo(() => {
    return selectedFields.length === supportedFields.length && selectedFields.length > 0;
  }, [selectedFields]);

  const onSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setSelectedFields(checked ? supportedFields.map((field) => field.uniqueId) : []);
  };

  return (
    <>
      <Paragraph lineHeight="lineHeightCondensed">
        Select fields that you want to sync. Each field will map to a custom module that can be used
        in Hubspot emails. If edits are made in Contentful, content will update automatically.
      </Paragraph>

      <Box className={styles.box}>
        <Box paddingLeft="spacingS" paddingTop="spacingXs" paddingBottom="spacingXs">
          <Checkbox isChecked={allSelected} onChange={onSelectAll}>
            <Text fontSize="fontSizeS" fontColor="gray700" lineHeight="lineHeightS">
              Select all fields ({fields.length})
            </Text>
          </Checkbox>
        </Box>

        {fields.map((field) => {
          return (
            <FieldCheckbox
              field={field}
              key={field.uniqueId}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
            />
          );
        })}
      </Box>
    </>
  );
};

type FieldCheckboxProps = {
  field: SdkField;
  selectedFields: string[];
  setSelectedFields: React.Dispatch<React.SetStateAction<string[]>>;
};

const FieldCheckbox = (props: FieldCheckboxProps) => {
  const { field, selectedFields, setSelectedFields } = props;

  const displayName = field.locale ? `${field.name} (${field.locale})` : field.name;
  const checked = useMemo(() => selectedFields.includes(field.uniqueId), [selectedFields]);

  const onFieldSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = event.target;
    setSelectedFields((prev) =>
      checked ? [...prev, id] : prev.filter((fieldId) => id !== fieldId)
    );
  };

  const displayType = (field: SdkField) => {
    if (field.type === 'Symbol') return 'Short text';
    else if (field.type === 'RichText') return 'Rich text';
    else if (field.type === 'Link') return field.linkType === 'Entry' ? 'Reference' : 'Media';
    else if (field.type === 'Array') {
      if (field.items?.type === 'Symbol') return 'Short text list';
      return field.items?.linkType === 'Entry' ? 'Reference list' : 'Media list';
    }

    return field.type;
  };

  return (
    <Box
      paddingLeft="spacingS"
      paddingTop="spacingXs"
      paddingBottom="spacingXs"
      className={css({
        borderTop: `1px solid ${tokens.gray300}`,
      })}>
      <Checkbox
        key={field.uniqueId}
        id={field.uniqueId}
        isChecked={checked}
        onChange={onFieldSelected}
        isDisabled={!field.supported}>
        <Text fontColor={field.supported ? 'gray900' : 'gray500'} fontWeight="fontWeightMedium">
          {displayName}
        </Text>
        <Text fontColor="gray500">({displayType(field)})</Text>
      </Checkbox>
    </Box>
  );
};

export default FieldSelection;
