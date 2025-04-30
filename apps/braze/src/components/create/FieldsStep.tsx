import { Button, FormControl, Paragraph } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';
import React from 'react';

type FieldsStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  setSelectedFields: (fields: Set<string>) => void;
  handleNextStep: () => void;
};

const FieldsStep = ({
  entry,
  selectedFields,
  setSelectedFields,
  handleNextStep,
}: FieldsStepProps) => {
  const allFields = entry.fields;
  const allFieldIds = allFields.map((field) => field.uniqueId());
  const allSelected = selectedFields.size === allFieldIds.length;

  const idToLabel = Object.fromEntries(
    allFields.map((f) => [f.uniqueId(), f.displayNameForCreate()])
  );
  const labelToId = Object.fromEntries(
    allFields.map((f) => [f.displayNameForCreate(), f.uniqueId()])
  );

  const currentSelection = Array.from(selectedFields)
    .map((id) => idToLabel[id])
    .filter(Boolean);

  const handleSelectField = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;
    const id = labelToId[value];
    const newSelectedFields = new Set(selectedFields);
    if (checked) {
      newSelectedFields.add(id);
    } else {
      newSelectedFields.delete(id);
    }
    setSelectedFields(newSelectedFields);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedFields(new Set(allFieldIds));
    } else {
      setSelectedFields(new Set());
    }
  };

  return (
    <>
      <Paragraph>
        Select the fields you would like to generate into Content Blocks. Referenced fields are not
        available in this list, but can be linked directly through the entry.
      </Paragraph>
      <FormControl isRequired isInvalid={setSelectedFields.length === 0} marginBottom="spacing4Xl">
        <FormControl.Label>Select Fields</FormControl.Label>
        <Multiselect
          currentSelection={currentSelection}
          popoverProps={{ isFullWidth: true, listMaxHeight: 108 }}
          placeholder="Select one or more">
          <Multiselect.SelectAll onSelectItem={handleSelectAll} isChecked={allSelected} />
          {allFields.map((field) => (
            <Multiselect.Option
              key={field.uniqueId()}
              itemId={field.displayNameForCreate()}
              value={field.displayNameForCreate()}
              label={field.displayNameForCreate()}
              onSelectItem={handleSelectField}
              isChecked={selectedFields.has(field.uniqueId())}
              data-testid={`select-${entry.id}`}
            />
          ))}
        </Multiselect>
      </FormControl>
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

export default FieldsStep;
