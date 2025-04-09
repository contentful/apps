import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Skeleton } from '@contentful/f36-components';
import { useEffect, useRef, useState } from 'react';
import FieldsSelectionStep from '../components/FieldsSelectionStep';
import CodeBlocksStep from '../components/CodeBlocksStep';
import LocalesSelectionStep from '../components/LocalesSelectionStep';
import { createClient } from 'contentful-management';
import resolveResponse from 'contentful-resolve-response';
import { FieldsFactory } from '../fields/FieldsFactory';
import { Entry } from '../fields/Entry';
import { Field } from '../fields/Field';

export type EntryInfo = {
  id: string;
  contentTypeId: string;
  title: string;
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
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [entry, setEntry] = useState<Entry | undefined>(undefined);
  const fieldsRef = useRef<Field[]>([]);

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
      fieldsRef.current = await new FieldsFactory(cma).createFields(items[0]);
      const entry = new Entry(
        entryInfo.id,
        entryInfo.contentTypeId,
        entryInfo.title,
        fieldsRef.current,
        sdk.ids.space,
        sdk.ids.environment,
        sdk.parameters.installation.contentfulApiKey
      );
      setEntry(entry);
    };
    fetchEntry();
  }, []);

  if (!entry) {
    return (
      <Skeleton.Container width="97%">
        <Skeleton.BodyText offsetLeft="50" offsetTop="20" numberOfLines={4} />
      </Skeleton.Container>
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
          entry={entry}
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
