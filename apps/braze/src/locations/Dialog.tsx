import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Skeleton } from '@contentful/f36-components';
import { useEffect, useRef, useState } from 'react';
import { FieldsFactory } from '../fields/FieldsFactory';
import { Entry } from '../fields/Entry';
import { Field } from '../fields/Field';
import GenerateFlow from '../components/generate/GenerateFlow';
import CreateFlow from '../components/create/CreateFlow';
import { FIELDS_STEP } from '../utils';

export type InvocationParams = {
  step?: string;
  entryId: string;
  contentTypeId: string;
  title: string;
  selectedFields?: string[];
  selectedLocales?: string[];
  serializedEntry?: {};
  mode: string;
};

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();

  const invocationParams = sdk.parameters.invocation as InvocationParams;
  const currentStep = invocationParams.step || FIELDS_STEP;
  const currentSelectedFields = invocationParams.selectedFields || [];
  const currentSelectedLocales = invocationParams.selectedLocales || [];
  const currentEntry = invocationParams.serializedEntry
    ? Entry.fromSerialized(invocationParams.serializedEntry)
    : undefined;
  const mode = invocationParams.mode;

  const [entry, setEntry] = useState<Entry | undefined>(currentEntry);
  const fieldsRef = useRef<Field[]>(currentEntry ? currentEntry.fields : []);

  useEffect(() => {
    if (entry) {
      return;
    }

    const fetchEntry = async () => {
      const fieldsFactory = new FieldsFactory(
        invocationParams.entryId!,
        invocationParams.contentTypeId!,
        sdk.cma,
        sdk.locales.default
      );
      const cmaEntry = await fieldsFactory.getEntry();
      fieldsRef.current = await fieldsFactory.createFieldsForEntry(cmaEntry.fields);
      const entry = new Entry(
        invocationParams.entryId,
        invocationParams.contentTypeId,
        invocationParams.title,
        fieldsRef.current,
        sdk.ids.space,
        sdk.ids.environment,
        sdk.parameters.installation.contentfulApiKey,
        cmaEntry.sys.publishedAt,
        cmaEntry.sys.updatedAt
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

  return mode === 'generate' ? (
    <GenerateFlow
      sdk={sdk}
      entry={entry}
      invocationParams={invocationParams}
      initialStep={currentStep}
      initialSelectedFields={currentSelectedFields}
      initialSelectedLocales={currentSelectedLocales}
    />
  ) : (
    <CreateFlow
      sdk={sdk}
      entry={entry}
      invocationParams={invocationParams}
      initialSelectedFields={currentSelectedFields}
    />
  );
};

export default Dialog;
