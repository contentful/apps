import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Spinner, Stack } from '@contentful/f36-components';
import { useEffect, useState } from 'react';
import FieldsSelectionStep from '../components/FieldsSelectionStep';
import CodeBlocksStep from '../components/CodeBlocksStep';
import LocalesSelectionStep from '../components/LocalesSelectionStep';
import { createClient } from 'contentful-management';
import resolveResponse from 'contentful-resolve-response';
import { FieldsFactory } from '../fields/FieldsFactory';
import { Entry } from '../fields/Entry';

export type EntryInfo = {
  id: string;
  contentType: string;
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
  const [entry, setEntry] = useState<Entry>();

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
      const fields = await FieldsFactory.createFields(items[0], cma);
      const entry = new Entry(
        entryInfo.id,
        entryInfo.contentType,
        fields,
        sdk.ids.space,
        sdk.parameters.installation.apiKey
      );
      setEntry(entry);
    };
    fetchEntry();
  }, [entryInfo]);

  if (!entry) {
    return (
      <Stack flexDirection="column">
        <Spinner size="large" variant="primary" />
      </Stack>
    );
  }

  const shouldChooseLocales = locales.length > 1 && entry.anyFieldIsLocalized();

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
          entry={entry}
          selectedLocales={selectedLocales}
          handlePreviousStep={() => setStep(shouldChooseLocales ? LOCALES_STEP : FIELDS_STEP)}
          handleClose={() => sdk.close()}
        />
      )}
    </Box>
  );
};

export default Dialog;
