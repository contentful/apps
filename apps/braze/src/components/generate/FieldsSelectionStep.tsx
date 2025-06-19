import { Box, Button, Checkbox, Paragraph, TextLink, Text } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import WizardFooter from '../WizardFooter';
import FieldCheckbox from '../FieldCheckbox';
import { Entry } from '../../fields/Entry';
import React, { useState } from 'react';
import { Field } from '../../fields/Field';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

type FieldsSelectionStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  setSelectedFields: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleNextStep: () => void;
};

const FieldsSelectionStep = (props: FieldsSelectionStepProps) => {
  const { entry, selectedFields, setSelectedFields, handleNextStep } = props;

  const fields = entry.fields;
  const allFields = entry.getAllFields();
  const [entrySelected, setEntrySelected] = useState(selectedFields.size === allFields.length);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { checked, id } = event.target;
    const field = allFields.find((field) => field.uniqueId() === id);
    if (!field) {
      return;
    }

    field.toggle(checked);
    const newSelectedFields = new Set(selectedFields);

    updateSelectedFields(checked, newSelectedFields, field.uniqueId());
    toggleNestedFields(field, checked, newSelectedFields);
    toggleParentField(field, newSelectedFields);

    setSelectedFields(newSelectedFields);
    setEntrySelected(newSelectedFields.size === allFields.length);
  };

  const updateSelectedFields = (
    checked: boolean,
    selectedFields: Set<string>,
    id: string
  ): void => {
    checked ? selectedFields.add(id) : selectedFields.delete(id);
  };

  const toggleNestedFields = (field: any, checked: boolean, selectedFields: Set<string>): void => {
    for (const child of field.getChildren()) {
      updateSelectedFields(checked, selectedFields, child.uniqueId());

      if (child.getChildren().length > 0) {
        toggleNestedFields(child, checked, selectedFields);
      }
    }
  };

  const toggleParentField = (field: Field, selectedSet: Set<string>): void => {
    if (!field.parent) return;
    const children = field.parent.getChildren();

    const allChildrenSelected = children.every((child) => selectedSet.has(child.uniqueId()));
    if (allChildrenSelected) {
      selectedSet.add(field.parent.uniqueId());
    } else {
      selectedSet.delete(field.parent.uniqueId());
    }

    toggleParentField(field.parent, selectedSet);
  };

  const toggleEntry = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { checked } = event.target;
    if (checked) {
      allFields.forEach((field) => (field.selected = true));
      setEntrySelected(true);
      setSelectedFields(new Set(allFields.map((field) => field.uniqueId())));
    } else {
      allFields.forEach((field) => (field.selected = false));
      setEntrySelected(false);
      setSelectedFields(new Set());
    }
  };

  return (
    <>
      <Paragraph fontColor="gray700" lineHeight="lineHeightCondensed">
        Select which fields you would like to include in your Connected Content call. Selecting
        fields from referenced entries is limited to 5 nested references. For more information on
        Braze Connected Content {''}
        <TextLink
          icon={<ExternalLinkIcon />}
          alignIcon="end"
          href="https://www.braze.com/docs/user_guide/personalization_and_dynamic_content/connected_content"
          target="_blank"
          rel="noopener noreferrer">
          view documentation here
        </TextLink>
      </Paragraph>

      <Box
        className={css({
          border: `1px solid ${tokens.gray200}`,
          borderRadius: tokens.borderRadiusSmall,
        })}
        margin="spacingXs"
        marginBottom="spacingS"
        padding="spacingXs">
        <Checkbox id={entry.id} isChecked={entrySelected} onChange={toggleEntry}>
          <Text fontWeight="fontWeightDemiBold">{entry.title}</Text>
        </Checkbox>
      </Box>

      <Box paddingLeft="spacingL">
        {fields.map((field) => {
          return (
            <FieldCheckbox
              key={field.uniqueId()}
              field={field}
              handleToggle={handleToggle}
              selectedFields={selectedFields}
            />
          );
        })}
      </Box>

      <WizardFooter>
        <Button
          variant="primary"
          size="small"
          onClick={handleNextStep}
          isDisabled={selectedFields.size === 0}>
          Next
        </Button>
      </WizardFooter>
    </>
  );
};
export default FieldsSelectionStep;
