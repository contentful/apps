import { Box } from '@contentful/f36-components';
import { useState } from 'react';
import { Entry } from '../../fields/Entry';
import { DialogAppSDK } from '@contentful/app-sdk';
import { InvocationParams } from '../../locations/Dialog';
import FieldsStep from './FieldsStep';
import CreateStep from './CreateStep';
import SuccessStep from './SuccessStep';
import { FIELDS_STEP } from '../../utils';
import { createClient } from 'contentful-management';

const CREATE_STEP = 'create';
const SUCCESS_STEP = 'success';

type CreateFlowProps = {
  sdk: DialogAppSDK;
  entry: Entry;
  invocationParams: InvocationParams;
  initialSelectedFields?: string[];
};

const CreateFlow = (props: CreateFlowProps) => {
  const { sdk, entry, initialSelectedFields = [] } = props;
  const [step, setStep] = useState(FIELDS_STEP);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialSelectedFields));
  const [contentBlockName, setContentBlockName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  const handleCreate = async (contentBlockNames: Record<string, string>) => {
    setIsSubmitting(true);

    const connectedFields = JSON.parse(sdk.parameters.installation.brazeConnectedFields || '{}');
    const entryConnectedFields = connectedFields[entry.id] || [];

    try {
      const response = await cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'createContentBlocksAction',
        },
        {
          parameters: {
            entryId: entry.id,
            fieldIds: Array.from(selectedFields).join(','),
            contentBlockNames: JSON.stringify(contentBlockNames),
        },
        }
      );
      const data = JSON.parse(response.response.body);
      // TODO: define type returned by the action
      const newFields = data.results
        .filter((result: any) => result.success)
        .map((result: any) => [result.fieldId, result.contentBlockId]);

      connectedFields[entry.id] = [...entryConnectedFields, ...newFields];
      sdk.parameters.installation.brazeConnectedFields = JSON.stringify(connectedFields);

      setIsSubmitting(false);
      setStep(SUCCESS_STEP);
    } catch (error) {
      // TODO: handle errors
      console.error(error);
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
          handleNextStep={() => setStep(CREATE_STEP)}
        />
      )}
      {step === CREATE_STEP && (
        <CreateStep
          entry={entry}
          selectedFields={selectedFields}
          contentBlockName={contentBlockName}
          setContentBlockName={setContentBlockName}
          isSubmitting={isSubmitting}
          handlePreviousStep={() => setStep(FIELDS_STEP)}
          handleNextStep={handleCreate}
        />
      )}
      {step === SUCCESS_STEP && (
        <SuccessStep
          entry={entry}
          selectedFields={selectedFields}
          handleClose={() => sdk.close({ step: 'close' })}
        />
      )}
    </Box>
  );
};

export default CreateFlow;
