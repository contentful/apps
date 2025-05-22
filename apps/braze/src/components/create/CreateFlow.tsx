import { Box } from '@contentful/f36-components';
import { useState } from 'react';
import { Entry } from '../../fields/Entry';
import { DialogAppSDK } from '@contentful/app-sdk';
import { InvocationParams } from '../../locations/Dialog';
import FieldsStep from './FieldsStep';
import CreateStep from './CreateStep';
import SuccessStep from './SuccessStep';
import {
  CONFIG_FIELD_ID,
  EntryConnectedFields,
  EntryStatus,
  FIELDS_STEP,
  getConfigEntry,
  updateConfig,
} from '../../utils';
import { createClient } from 'contentful-management';
import DraftStep from './DraftStep';
import ErrorStep from './ErrorStep';

const CREATE_STEP = 'create';
const DRAFT_STEP = 'draft';
const ERROR_STEP = 'error';
const SUCCESS_STEP = 'success';
const BRAZE_NAME_EXISTS_ERROR = 'name already exists';

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

    const names: Record<string, string> = {};
    const descriptions: Record<string, string> = {};
    Object.entries(data.names)
      .filter(
        ([fieldId, fieldName]) =>
          !creationResultFields.some((result) => result.fieldId === fieldId && result.success)
      )
      .forEach(([fieldId, fieldName]) => (names[fieldId] = fieldName));
    Object.entries(data.descriptions)
      .filter(
        ([fieldId, fieldDescription]) =>
          !creationResultFields.some((result) => result.fieldId === fieldId && result.success)
      )
      .forEach(([fieldId, fieldDescription]) => (descriptions[fieldId] = fieldDescription));
    const fieldsIds = Array.from(selectedFields)
      .filter(
        (fieldId) =>
          !creationResultFields.some((result) => result.fieldId === fieldId && result.success)
      )
      .join(',');

    try {
      const configEntry = await getConfigEntry(cma);
      const connectedFields = configEntry.fields[CONFIG_FIELD_ID]?.[sdk.locales.default] || {};
      const entryConnectedFields: EntryConnectedFields = connectedFields[entry.id] || [];

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
            fieldIds: fieldsIds,
            contentBlockNames: JSON.stringify(names),
            contentBlockDescriptions: JSON.stringify(descriptions),
          },
        }
      );
      const responseData: { results: CreationResultField[] } = JSON.parse(response.response.body);

      const newFields = responseData.results
        .filter((result: any) => result.success)
        .map((result: any) => {
          return {
            fieldId: result.fieldId,
            contentBlockId: result.contentBlockId,
          };
        });

      connectedFields[entry.id] = [...entryConnectedFields, ...newFields];

      await updateConfig(configEntry, connectedFields, cma);

      const newCreationResultFields: CreationResultField[] = [
        ...creationResultFields.filter(
          (newResult: CreationResultField) =>
            !responseData.results.some((oldResult) => oldResult.fieldId === newResult.fieldId)
        ),
        ...responseData.results,
      ];
      setCreationResultFields(newCreationResultFields);

      const errors = responseData.results.filter((result: any) => !result.success);
      if (errors.length > 0) {
        if (!errors.some((error: any) => error.message?.includes(BRAZE_NAME_EXISTS_ERROR))) {
          setStep(ERROR_STEP);
        }
        return;
      }

      setStep(SUCCESS_STEP);
    } catch (error) {
      console.error('Error creating content blocks: ', error);
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
          creationResultFields={creationResultFields}
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
