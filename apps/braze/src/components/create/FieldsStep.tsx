import { Button, FormControl, Select, Option, Paragraph } from '@contentful/f36-components';
import { Entry } from '../../fields/Entry';
import WizardFooter from '../WizardFooter';

type FieldsStepProps = {
  entry: Entry;
  selectedFields: Set<string>;
  setSelectedFields: (fields: Set<string>) => void;
  onNext: () => void;
};

const FieldsStep = ({ entry, selectedFields, setSelectedFields, onNext }: FieldsStepProps) => {
  const handleFieldChange = (fieldId: string) => {
    const newSelectedFields = new Set(selectedFields);
    if (newSelectedFields.has(fieldId)) {
      newSelectedFields.delete(fieldId);
    } else {
      newSelectedFields.add(fieldId);
    }
    setSelectedFields(newSelectedFields);
  };

  return (
    <>
      <Paragraph>
        Select the fields you would like to generate into Content Blocks. Referenced fields are not
        available in this list, but can be linked directly through the entry.
      </Paragraph>
      <FormControl marginBottom="spacingXs">
        <FormControl.Label>Select Fields</FormControl.Label>
        <Select
          value={Array.from(selectedFields)[selectedFields.size - 1] || ''}
          onChange={(e) => handleFieldChange(e.target.value)}>
          <Option value="">Select a field</Option>
          {entry.fields.map((field) => (
            <Option key={field.uniqueId()} value={field.uniqueId()}>
              {field.displayName()}
            </Option>
          ))}
        </Select>
      </FormControl>
      <WizardFooter paddingTop="spacing2Xs" paddingBottom="0" paddingRight="0">
        <Button
          variant="primary"
          size="small"
          onClick={onNext}
          isDisabled={selectedFields.size === 0}>
          Next
        </Button>
      </WizardFooter>
    </>
  );
};

export default FieldsStep;
