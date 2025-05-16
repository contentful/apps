import { Box } from '@contentful/f36-components';
import { useState } from 'react';
import { Entry } from '../../fields/Entry';
import { DialogAppSDK } from '@contentful/app-sdk';
import { InvocationParams } from '../../locations/Dialog';
import FieldsStep from './FieldsStep';
import CreateStep from './CreateStep';
import SuccessStep from './SuccessStep';
import { EntryStatus, FIELDS_STEP } from '../../utils';
import { createClient } from 'contentful-management';
import DraftStep from './DraftStep';
import ErrorStep from './ErrorStep';

const CREATE_STEP = 'create';
const DRAFT_STEP = 'draft';
const ERROR_STEP = 'error';
const SUCCESS_STEP = 'success';

type CreateFlowProps = {
  sdk: DialogAppSDK;
  entry: Entry;
  invocationParams: InvocationParams;
  initialSelectedFields?: string[];
};

export type ContentBlockData = {
  names: Record<string, string>;
  descriptions: Record<string, string>;
};

export type CreationResultField = {
  fieldId: string;
  success: boolean;
  statusCode: number;
  message: string;
};

const CreateFlow = (props: CreateFlowProps) => {
  const { sdk, entry, initialSelectedFields = [] } = props;
  const [step, setStep] = useState(FIELDS_STEP);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialSelectedFields));
  const [creationResultFields, setCreationResultFields] = useState<CreationResultField[]>([]);
  const [contentBlocksData, setContentBlocksData] = useState<ContentBlockData>({
    names: {},
    descriptions: {},
  });
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

  const handleCreate = async (data: ContentBlockData) => {
    if (entry.state !== EntryStatus.Published && step === CREATE_STEP) {
      setStep(DRAFT_STEP);
      return;
    }

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
            contentBlockNames: JSON.stringify(data.names),
            contentBlockDescriptions: JSON.stringify(data.descriptions),
          },
        }
      );
      const responseData = JSON.parse(response.response.body);

      const newFields = responseData.results
        .filter((result: any) => result.success)
        .map((result: any) => [result.fieldId, result.contentBlockId]);

      connectedFields[entry.id] = [...entryConnectedFields, ...newFields];
      sdk.parameters.installation.brazeConnectedFields = JSON.stringify(connectedFields);

      setCreationResultFields(responseData.results);

      const errors = responseData.results.filter((result: any) => !result.success);
      if (errors.length > 0) {
        setStep(ERROR_STEP);
        setIsSubmitting(false);
        return;
      }

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
          isSubmitting={isSubmitting}
          handlePreviousStep={() => setStep(FIELDS_STEP)}
          contentBlocksData={contentBlocksData}
          setContentBlocksData={setContentBlocksData}
          handleNextStep={handleCreate}
        />
      )}
      {step === DRAFT_STEP && (
        <DraftStep
          isSubmitting={isSubmitting}
          handlePreviousStep={() => setStep(CREATE_STEP)}
          contentBlocksData={contentBlocksData}
          handleNextStep={handleCreate}
        />
      )}
      {step === ERROR_STEP && (
        <ErrorStep
          isSubmitting={isSubmitting}
          creationResultFields={creationResultFields}
          contentBlocksData={contentBlocksData}
          handleCreate={handleCreate}
          handleClose={() => sdk.close({ step: 'close' })}
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
