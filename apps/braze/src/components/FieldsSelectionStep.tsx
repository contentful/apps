import { Box, Button, Checkbox, Paragraph, TextLink, Text } from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import WizardFooter from './WizardFooter';
import FieldCheckbox from './FieldCheckbox';
import { Entry } from '../fields/Entry';
import { useState } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

type FieldsSelectionStepProps = {
  entry: Entry;
  handleNextStep: () => void;
};
const FieldsSelectionStep = (props: FieldsSelectionStepProps) => {
  const { entry, handleNextStep } = props;
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [entrySelected, setEntrySelected] = useState(entry.fields.some((field) => field.selected));

  const fields = entry.fields;
  const allFields = entry.getAllFields();

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { checked, id } = event.target;
    if (checked) {
      allFields.find((field) => field.uniqueId() === id)?.select();
      setEntrySelected(true);
      setSelectedFields([...selectedFields, id]);
    } else {
      allFields.find((field) => field.uniqueId() === id)?.deselect();
      const newSelectedFields = selectedFields.filter((field) => field !== id);
      setSelectedFields(newSelectedFields);
      if (newSelectedFields.length === 0) {
        setEntrySelected(false);
      }
    }
  };

  const toggleEntry = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { checked } = event.target;
    if (checked) {
      allFields.forEach((field) => (field.selected = true));
      setEntrySelected(true);
      setSelectedFields(allFields.map((field) => field.uniqueId()));
    } else {
      allFields.forEach((field) => (field.selected = false));
      setEntrySelected(false);
      setSelectedFields([]);
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
          <Text fontWeight="fontWeightDemiBold">The Entry</Text>
        </Checkbox>
      </Box>

      <Box paddingLeft="spacingL">
        {fields.map((field) => {
          return <FieldCheckbox key={field.uniqueId()} field={field} handleToggle={handleToggle} />;
        })}
      </Box>

      <WizardFooter>
        <Button variant="primary" size="small" onClick={handleNextStep} isDisabled={!entrySelected}>
          Next
        </Button>
      </WizardFooter>
    </>
  );
};
export default FieldsSelectionStep;
