import { Box } from '@contentful/f36-components';
import { useState } from 'react';
import { Entry } from '../fields/Entry';
import { DialogAppSDK } from '@contentful/app-sdk';
import { InvocationParams } from '../locations/Dialog';
import FieldsStep from './FieldsStep';
import CreateStep from './CreateStep';
import SuccessStep from './SuccessStep';

const FIELDS_STEP = 'fields';
const CREATE_STEP = 'create';
const SUCCESS_STEP = 'success';

type CreateFlowProps = {
  sdk: DialogAppSDK;
  entry: Entry;
  invocationParams: InvocationParams;
  locales: string[];
  initialStep?: string;
  initialSelectedFields?: string[];
  initialSelectedLocales?: string[];
};

const CreateFlow = (props: CreateFlowProps) => {
  const { sdk, entry, initialStep = FIELDS_STEP, initialSelectedFields = [] } = props;

  const [step, setStep] = useState(initialStep);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialSelectedFields));
  const [contentBlockName, setContentBlockName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement the actual creation of content blocks in Braze
      // This would involve making an API call to Braze with the selected fields
      setStep(SUCCESS_STEP);
    } catch (error) {
      console.error('Failed to create content block:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      paddingBottom="spacingM"
      paddingTop="spacingM"
      paddingLeft="spacingL"
      paddingRight="spacingL">
      {step === FIELDS_STEP && (
        <FieldsStep
          entry={entry}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          onNext={() => setStep(CREATE_STEP)}
        />
      )}
      {step === CREATE_STEP && (
        <CreateStep
          entry={entry}
          selectedFields={selectedFields}
          contentBlockName={contentBlockName}
          setContentBlockName={setContentBlockName}
          isSubmitting={isSubmitting}
          onBack={() => setStep(FIELDS_STEP)}
          onCreate={handleCreate}
        />
      )}
      {step === SUCCESS_STEP && (
        <SuccessStep
          entry={entry}
          selectedFields={selectedFields}
          onClose={() => sdk.close({ step: 'close' })}
        />
      )}
    </Box>
  );
};

export default CreateFlow;
