import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Spinner, Stack } from '@contentful/f36-components';
import { useEffect, useState } from 'react';
import FieldsSelectionStep from '../components/FieldsSelectionStep';
import CodeBlocksStep from '../components/CodeBlocksStep';
import LocalesSelectionStep from '../components/LocalesSelectionStep';
import { Field } from '../fields/Field';
import { createClient } from 'contentful-management';
import resolveResponse from 'contentful-resolve-response';
import { transformEntryFields } from '../helpers/transformEntryFields';

export type EntryInfo = {
  id: string;
  contentTypeId: string;
};

const FIELDS_STEP = 'fields';
const LOCALES_STEP = 'locales';
const CODE_BLOCKS_STEP = 'codeBlocks';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();
  const locales = sdk.locales.available;
  const entryInfo = sdk.parameters.invocation as EntryInfo;
  const [step, setStep] = useState('fields');
  const [selectedLocales, setSelectedLocales] = useState<string[]>([sdk.locales.default]);
  const [entryFields, setEntryFields] = useState<Field[]>([]);

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );
  useEffect(() => {
    const fetchEntry = async () => {
      const response = await cma.entry.references({ entryId: entryInfo.id, include: 5 });
      const items = resolveResponse(response);
      const fields = await transformEntryFields(items[0], cma);
      setEntryFields(fields);
    };
    fetchEntry();
  }, [entryInfo]);

  if (entryFields.length === 0) {
    return (
      <Stack flexDirection="column">
        <Spinner size="large" variant="primary" />
      </Stack>
    );
  }

  const anyFieldIsLocalized = entryFields.some((field) => field.localized);
  const shouldChooseLocales = locales.length > 1 && anyFieldIsLocalized;

  return (
    <Box
      paddingBottom="spacingM"
      paddingTop="spacingM"
      paddingLeft="spacingL"
      paddingRight="spacingL">
      {step === FIELDS_STEP && (
        <FieldsSelectionStep
          handleNextStep={() =>
            setStep(shouldChooseLocales ? LOCALES_STEP : CODE_BLOCKS_STEP)
          }></FieldsSelectionStep>
      )}
      {step === LOCALES_STEP && (
        <LocalesSelectionStep
          locales={locales}
          selectedLocales={selectedLocales}
          setSelectedLocales={setSelectedLocales}
          handlePreviousStep={() => setStep(FIELDS_STEP)}
          handleNextStep={() => setStep(CODE_BLOCKS_STEP)}></LocalesSelectionStep>
      )}
      {step === CODE_BLOCKS_STEP && (
        <CodeBlocksStep
          spaceId={sdk.ids.space}
          contentfulToken={sdk.parameters.installation.apiKey}
          entryInfo={entryInfo}
          fields={entryFields}
          selectedLocales={selectedLocales}
          handlePreviousStep={() => setStep(shouldChooseLocales ? LOCALES_STEP : FIELDS_STEP)}
          handleClose={() => sdk.close()}></CodeBlocksStep>
      )}
    </Box>
  );
};

export default Dialog;
