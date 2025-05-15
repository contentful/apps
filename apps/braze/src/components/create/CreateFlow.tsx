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

export type ContentBlockData = {
  names: Record<string, string>;
  descriptions: Record<string, string>;
};

type FieldError = {
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
  const [fieldsWithErrors, setFieldsWithErrors] = useState<FieldError[]>([]);
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
