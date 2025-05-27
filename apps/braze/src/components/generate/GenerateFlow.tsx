import { Box } from '@contentful/f36-components';
import { useState } from 'react';
import FieldsSelectionStep from './FieldsSelectionStep';
import CodeBlocksStep from './CodeBlocksStep';
import LocalesSelectionStep from './LocalesSelectionStep';
import { Entry } from '../../fields/Entry';
import { DialogAppSDK } from '@contentful/app-sdk';
import { InvocationParams } from '../../locations/Dialog';
import { FIELDS_STEP } from '../../utils';

const LOCALES_STEP = 'locales';
const CODE_BLOCKS_STEP = 'codeBlocks';

type GenerateFlowProps = {
  sdk: DialogAppSDK;
  entry: Entry;
  invocationParams: InvocationParams;
  initialStep?: string;
  initialSelectedFields?: string[];
  initialSelectedLocales?: string[];
};

const GenerateFlow = (props: GenerateFlowProps) => {
  const {
    sdk,
    entry,
    invocationParams,
    initialStep = FIELDS_STEP,
    initialSelectedFields = [],
    initialSelectedLocales = [],
  } = props;

  const [step, setStep] = useState(initialStep);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialSelectedFields));
  const [selectedLocales, setSelectedLocales] = useState<string[]>(initialSelectedLocales);

  const locales = sdk.locales.available;
  const shouldChooseLocales = locales.length > 1 && entry.anyFieldIsLocalized();

  return (
    <Box
      paddingBottom="spacingM"
      paddingTop="spacingM"
      paddingLeft="spacingL"
      paddingRight="spacingL">
      {step === FIELDS_STEP && (
        <FieldsSelectionStep
          entry={entry}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          handleNextStep={() =>
            shouldChooseLocales
              ? setStep(LOCALES_STEP)
              : sdk.close({
                  step: CODE_BLOCKS_STEP,
                  entryId: invocationParams.entryId,
                  contentTypeId: invocationParams.contentTypeId,
                  title: invocationParams.title,
                  serializedEntry: entry.serialize(),
                })
          }
        />
      )}
      {step === LOCALES_STEP && (
        <LocalesSelectionStep
          locales={locales}
          selectedLocales={selectedLocales}
          setSelectedLocales={setSelectedLocales}
          handlePreviousStep={() => setStep(FIELDS_STEP)}
          handleNextStep={() =>
            sdk.close({
              step: CODE_BLOCKS_STEP,
              entryId: invocationParams.entryId,
              contentTypeId: invocationParams.contentTypeId,
              title: invocationParams.title,
              serializedEntry: entry.serialize(),
              selectedFields: selectedFields,
              selectedLocales: selectedLocales,
            })
          }
        />
      )}
      {step === CODE_BLOCKS_STEP && (
        <CodeBlocksStep
          entry={entry}
          selectedLocales={selectedLocales}
          handlePreviousStep={() =>
            sdk.close({
              step: shouldChooseLocales ? LOCALES_STEP : FIELDS_STEP,
              entryId: invocationParams.entryId,
              contentTypeId: invocationParams.contentTypeId,
              title: invocationParams.title,
              selectedFields: selectedFields,
              selectedLocales: selectedLocales,
              serializedEntry: entry.serialize(),
            })
          }
          handleClose={() => sdk.close({ step: 'close' })}
        />
      )}
    </Box>
  );
};

export default GenerateFlow;
