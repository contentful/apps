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
import ClientErrorStep from './ClientErrorStep';

const CREATE_STEP = 'create';
const DRAFT_STEP = 'draft';
const CLIENT_ERROR_STEP = 'client-error';
const SUCCESS_STEP = 'success';

type CreateFlowProps = {
  sdk: DialogAppSDK;
  entry: Entry;
  invocationParams: InvocationParams;
  initialSelectedFields?: string[];
};

export type ContentBlockState = {
  names: Record<string, string>;
  descriptions: Record<string, string>;
};

type FieldError = {
  fieldId: string;
  success: boolean;
  statusCode: number;
  message: string;
};

const CreateFlow = (props: CreateFlowProps) => {
  const { sdk, entry, initialSelectedFields = [] } = props;
  const [step, setStep] = useState(FIELDS_STEP);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialSelectedFields));
  const [fieldsWithErrors, setFieldsWithErrors] = useState<FieldError[]>([]);
  const [contentBlockStates, setContentBlockStates] = useState<ContentBlockState>({
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

  const handleCreate = async (data: ContentBlockState) => {
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

      const errors = responseData.results.filter((result: any) => !result.success);
      const clientErrors = errors.filter((result: any) => result.statusCode !== 500);
      if (errors.length > 0 && clientErrors.length > 0) {
        setFieldsWithErrors(errors);
        setStep(CLIENT_ERROR_STEP);
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
          contentBlockStates={contentBlockStates}
          setContentBlockStates={setContentBlockStates}
          handleNextStep={handleCreate}
        />
      )}
      {step === DRAFT_STEP && (
        <DraftStep
          isSubmitting={isSubmitting}
          handlePreviousStep={() => setStep(CREATE_STEP)}
          contentBlockStates={contentBlockStates}
          handleNextStep={handleCreate}
        />
      )}
      {step === CLIENT_ERROR_STEP && (
        <ClientErrorStep
          fieldsWithErrors={fieldsWithErrors}
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
