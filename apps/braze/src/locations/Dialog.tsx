import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Field } from '../helpers/assembleQuery';

import { Box } from '@contentful/f36-components';
import { useState } from 'react';
import FieldsSelectionStep from '../components/FieldsSelectionStep';
import CodeBlocksStep from '../components/CodeBlocksStep';
import LocalesSelectionStep from '../components/LocalesSelectionStep';

export type EntryInfo = {
  id: string;
  fields: Field[];
  contentTypeId: string;
};

const FIELDS_STEP = 'fields';
const LOCALES_STEP = 'locales';
const CODE_BLOCKS_STEP = 'codeBlocks';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();
  const [step, setStep] = useState('fields');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([sdk.locales.default]);

  const entryInfo = sdk.parameters.invocation as EntryInfo;
  const locales = sdk.locales.available;
  const anyFieldIsLocalized = entryInfo.fields.some((field) => field.localized);
  const shouldChooseLocales = locales.length > 1 && anyFieldIsLocalized;

  return (
    <Box
      paddingBottom="spacingM"
      paddingTop="spacingM"
      paddingLeft="spacingL"
      paddingRight="spacingL">
      {step === FIELDS_STEP && (
        <FieldsSelectionStep
          handleNextStep={() => setStep(shouldChooseLocales ? LOCALES_STEP : CODE_BLOCKS_STEP)}
        />
      )}
      {step === LOCALES_STEP && (
        <LocalesSelectionStep
          locales={locales}
          selectedLocales={selectedLocales}
          setSelectedLocales={setSelectedLocales}
          handlePreviousStep={() => setStep(FIELDS_STEP)}
          handleNextStep={() => setStep(CODE_BLOCKS_STEP)}
        />
      )}
      {step === CODE_BLOCKS_STEP && (
        <CodeBlocksStep
          spaceId={sdk.ids.space}
          contentfulToken={sdk.parameters.installation.apiKey}
          entryInfo={entryInfo}
          selectedLocales={selectedLocales}
          handlePreviousStep={() => setStep(shouldChooseLocales ? LOCALES_STEP : FIELDS_STEP)}
          handleClose={() => sdk.close()}
        />
      )}
    </Box>
  );
};

export default Dialog;
