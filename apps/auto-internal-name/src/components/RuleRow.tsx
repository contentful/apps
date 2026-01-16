import React, { useState } from 'react';
import { Autocomplete, Box, Flex, FormControl, IconButton } from '@contentful/f36-components';
import { TrashSimpleIcon } from '@contentful/f36-icons';
import { FieldSelection, Rule, RuleValidation } from '../utils/types';
import { styles } from './RuleRow.styles';

type RuleRowProps = {
  rule: Rule;
  availableFields: FieldSelection[];
  validation?: RuleValidation;
  onRuleChange: (rule: Rule) => void;
  onRuleDelete: (ruleId: string) => void;
};

const RuleRow: React.FC<RuleRowProps> = ({
  rule,
  availableFields,
  validation,
  onRuleChange,
  onRuleDelete,
}) => {
  const [filteredParentFields, setFilteredParentFields] =
    useState<FieldSelection[]>(availableFields);
  const [filteredReferenceFields, setFilteredReferenceFields] =
    useState<FieldSelection[]>(availableFields);

  const normalizeString = (str: string) => (str ? str.trim().toLowerCase() : '');

  const filterFieldsByDisplayName = (
    fields: FieldSelection[],
    filterValue: string
  ): FieldSelection[] => {
    if (!filterValue) return fields;

    const normalizedFilter = normalizeString(filterValue);
    return fields.filter((field) => normalizeString(field.displayName).includes(normalizedFilter));
  };

  const handleParentFieldInputChange = (value: string) => {
    const filtered = filterFieldsByDisplayName(availableFields, value);
    setFilteredParentFields(filtered);
    if (value === '') {
      onRuleChange({ ...rule, parentField: null });
    }
  };

  const handleReferenceFieldInputChange = (value: string) => {
    const filtered = filterFieldsByDisplayName(availableFields, value);
    setFilteredReferenceFields(filtered);
    if (value === '') {
      onRuleChange({ ...rule, referenceField: null });
    }
  };

  return (
    <Box className={styles.container}>
      <Flex flexDirection="row" alignItems="flex-start" gap="spacingXl" fullWidth>
        <FormControl
          id={`parent-field-${rule.id}`}
          isInvalid={validation?.parentFieldError}
          isRequired
          style={{ flex: 1 }}>
          <FormControl.Label marginBottom="spacingS">Parent field</FormControl.Label>
          <Autocomplete
            testId="parent-field-autocomplete"
            listWidth="full"
            items={filteredParentFields}
            selectedItem={rule.parentField}
            onInputValueChange={handleParentFieldInputChange}
            onSelectItem={(field: FieldSelection | null) => {
              onRuleChange({ ...rule, parentField: field || null });
            }}
            placeholder="Field name | Content type name"
            itemToString={(item: FieldSelection | null) => (item ? item.displayName : '')}
            renderItem={(item: FieldSelection | null) => (item ? item.displayName : '')}
          />
          {validation?.parentFieldError && (
            <FormControl.ValidationMessage>
              {validation.parentFieldErrorMessage}
            </FormControl.ValidationMessage>
          )}
        </FormControl>

        <FormControl
          id={`reference-field-${rule.id}`}
          isInvalid={validation?.referenceFieldError}
          isRequired
          style={{ flex: 1 }}>
          <FormControl.Label marginBottom="spacingS">Reference entries</FormControl.Label>
          <Autocomplete
            testId="reference-field-autocomplete"
            listWidth="full"
            items={filteredReferenceFields}
            selectedItem={rule.referenceField}
            onInputValueChange={handleReferenceFieldInputChange}
            onSelectItem={(field: FieldSelection | null) => {
              onRuleChange({ ...rule, referenceField: field || null });
            }}
            placeholder="Field name | Content type name"
            itemToString={(item: FieldSelection | null) => (item ? item.displayName : '')}
            renderItem={(item: FieldSelection | null) => (item ? item.displayName : '')}
          />
          {validation?.referenceFieldError && (
            <FormControl.ValidationMessage>
              {validation.referenceFieldErrorMessage}
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Flex>
      <Box className={styles.deleteButton} marginTop="spacingXl">
        <IconButton
          aria-label="Delete configuration"
          icon={<TrashSimpleIcon />}
          variant="secondary"
          onClick={() => onRuleDelete(rule.id)}
        />
      </Box>
    </Box>
  );
};

export default RuleRow;
