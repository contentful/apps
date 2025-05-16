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

export type EntryConnectedFields = {
  fieldId: string;
  contentBlockId: string;
}[];

export type ConnectedFields = {
  [entryId: string]: EntryConnectedFields;
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
            fieldIds: Array.from(selectedFields).join(','),
            contentBlockNames: JSON.stringify(data.names),
            contentBlockDescriptions: JSON.stringify(data.descriptions),
          },
        }
      );
      const responseData = JSON.parse(response.response.body);

      const newFields = responseData.results
        .filter((result: any) => result.success)
        .map((result: any) => {
          return {
            fieldId: result.fieldId,
            contentBlockId: result.contentBlockId,
          };
        });

      connectedFields[entry.id] = [...entryConnectedFields, ...newFields];

      await updateConfig(configEntry, sdk.locales.default, connectedFields, cma);

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
