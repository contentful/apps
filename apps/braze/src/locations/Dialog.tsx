import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Box, Skeleton } from '@contentful/f36-components';
import { useEffect, useRef, useState } from 'react';
import FieldsSelectionStep from '../components/FieldsSelectionStep';
import CodeBlocksStep from '../components/CodeBlocksStep';
import LocalesSelectionStep from '../components/LocalesSelectionStep';
import { createClient } from 'contentful-management';
import { FieldsFactory } from '../fields/FieldsFactory';
import { Entry } from '../fields/Entry';
import { Field } from '../fields/Field';

export type InvocationParams = {
  step: string;
  entryId?: string;
  contentTypeId?: string;
  title?: string;
  selectedLocales?: string[];
  serializedEntry?: {};
};

const FIELDS_STEP = 'fields';
const LOCALES_STEP = 'locales';
const CODE_BLOCKS_STEP = 'codeBlocks';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();

  const invocationParams = sdk.parameters.invocation as InvocationParams;
  const currentStep = invocationParams.step;
  const currentSelectedLocales = invocationParams.selectedLocales || [];
  const currentEntry = invocationParams.serializedEntry
    ? Entry.fromSerialized(invocationParams.serializedEntry)
    : undefined;

  const locales = sdk.locales.available;

  const [step, setStep] = useState(currentStep);
  const [selectedLocales, setSelectedLocales] = useState<string[]>(currentSelectedLocales);
  const [entry, setEntry] = useState<Entry | undefined>(currentEntry);
  const fieldsRef = useRef<Field[]>(currentEntry ? currentEntry.fields : []);

  useEffect(() => {
    if (entry) {
      return;
    }
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

    const fetchEntry = async () => {
      const fields = await new FieldsFactory(
        invocationParams.entryId!,
        invocationParams.contentTypeId!,
        cma
      ).createFields();
      fieldsRef.current = fields;
      const entry = new Entry( // TODO: check if we can remove the !
        invocationParams.entryId!,
        invocationParams.contentTypeId!,
        invocationParams.title!,
        fieldsRef.current,
        sdk.ids.space,
        sdk.ids.environment,
        sdk.parameters.installation.apiKey
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
          handleNextStep={() =>
            shouldChooseLocales
              ? setStep(LOCALES_STEP)
              : sdk.close({
                  step: CODE_BLOCKS_STEP,
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
              serializedEntry: entry.serialize(),
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

export default Dialog;
