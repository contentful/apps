import { Box, Button, FormControl, Paragraph } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { Dispatch, SetStateAction } from 'react';
import WizardFooter from '../WizardFooter';
import { MULTISELECT_DIALOG_HEIGHT } from '../../utils';

type LocalesSelectionStepProps = {
  locales: string[];
  selectedLocales: string[];
  setSelectedLocales: Dispatch<SetStateAction<string[]>>;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
};
const LocalesSelectionStep = (props: LocalesSelectionStepProps) => {
  const { locales, selectedLocales, setSelectedLocales, handlePreviousStep, handleNextStep } =
    props;

  const handleSelectLocale = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { checked, value } = event.target;
    if (checked) {
      setSelectedLocales((prevState: string[]) => [...prevState, value]);
    } else {
      const newSelectedSpaces = selectedLocales.filter((space: string) => space !== value);
      setSelectedLocales(newSelectedSpaces);
    }
  };

  return (
    <>
      <Paragraph fontColor="gray700" lineHeight="lineHeightCondensed">
        Select the locales you want to reference in Braze messages.
      </Paragraph>

      <FormControl
        isRequired
        isInvalid={selectedLocales.length === 0}
        style={{ marginBottom: '7rem' }}>
        <FormControl.Label>Locales</FormControl.Label>
        <Multiselect
          currentSelection={selectedLocales}
          popoverProps={{ isFullWidth: true, listMaxHeight: MULTISELECT_DIALOG_HEIGHT }}
          placeholder="Select one or more">
          {locales.map((local) => {
            const val = local.toLowerCase().replace(/\s/g, '-');
            return (
              <Multiselect.Option
                key={`key-${val}}`}
                itemId={`space-${val}}`}
                value={local}
                label={local}
                onSelectItem={handleSelectLocale}
                isChecked={selectedLocales.includes(local)}
              />
            );
          })}
        </Multiselect>
      </FormControl>

      <WizardFooter>
        <Button variant="secondary" size="small" onClick={handlePreviousStep}>
          Back
        </Button>
        <Button
          variant="primary"
          size="small"
          onClick={handleNextStep}
          isDisabled={selectedLocales.length === 0}>
          Next
        </Button>
      </WizardFooter>
    </>
  );
};
export default LocalesSelectionStep;
