import { Button, FormControl, Paragraph } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';
import React from 'react';
import { Field } from '../../fields/Field';
import { MULTISELECT_DIALOG_HEIGHT } from '../../utils';

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
  const filteredFields = allFields.filter((field) => field.isEnabledForCreate());
  const idToLabel = Object.fromEntries(
    allFields.map((f) => [f.uniqueId(), f.displayNameForCreate()])
  );

  const allFieldIds = (fields: Field[]) => {
    return fields.map((field) => field.uniqueId());
  };

  const currentSelection = Array.from(selectedFields)
    .map((id) => idToLabel[id])
    .filter(Boolean);

  const handleSelectField = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, id } = event.target;
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
      setSelectedFields(new Set(allFieldIds(filteredFields)));
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
      <FormControl
        isRequired
        isInvalid={setSelectedFields.length === 0}
        style={{ marginBottom: '7rem' }}>
        <FormControl.Label>Select Fields</FormControl.Label>
        <Multiselect
          currentSelection={currentSelection}
          popoverProps={{ isFullWidth: true, listMaxHeight: MULTISELECT_DIALOG_HEIGHT }}
          placeholder="Select one or more">
          <Multiselect.SelectAll
            onSelectItem={handleSelectAll}
            isChecked={selectedFields.size === allFieldIds(filteredFields).length}
          />
          {allFields.map((field) => (
            <Multiselect.Option
              key={field.uniqueId()}
              itemId={field.uniqueId()}
              value={field.uniqueId()}
              label={field.displayNameForCreate()}
              onSelectItem={handleSelectField}
              isChecked={selectedFields.has(field.uniqueId())}
              data-testid={`select-${entry.id}`}
              isDisabled={!field.isEnabledForCreate()}
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
