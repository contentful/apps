import { Button, Paragraph, TextLink } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import WizardFooter from './WizardFooter';
import FieldCheckbox from './FieldCheckbox';
import { Entry } from '../fields/Entry';
import { useState } from 'react';

type FieldsSelectionStepProps = {
  entry: Entry;
  handleNextStep: () => void;
};
const FieldsSelectionStep = (props: FieldsSelectionStepProps) => {
  const { entry, handleNextStep } = props;
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const fields = entry.fields;
  const allFields = entry.getAllFields();

  const handleToggle = (event: { target: { checked: boolean; id: string } }): void => {
    const { checked, id } = event.target;
    if (checked) {
      allFields.find((field) => field.uniqueId() === id)?.select();
      setSelectedFields([...selectedFields, id]);
    } else {
      allFields.find((field) => field.uniqueId() === id)?.deselect();
      setSelectedFields(selectedFields.filter((field) => field !== id));
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

      {fields.map((field) => {
        return <FieldCheckbox key={field.uniqueId()} field={field} handleToggle={handleToggle} />;
      })}

      <WizardFooter>
        <Button variant="primary" size="small" onClick={handleNextStep}>
          Next
        </Button>
      </WizardFooter>
    </>
  );
};
export default FieldsSelectionStep;
