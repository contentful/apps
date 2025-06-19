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
  localizeFieldId,
} from '../../utils';
import { createClient } from 'contentful-management';
import DraftStep from './DraftStep';
import ErrorStep from './ErrorStep';
import LocalesSelectionStep from '../generate/LocalesSelectionStep';

const CREATE_STEP = 'create';
const DRAFT_STEP = 'draft';
const LOCALES_STEP = 'locales';
const ERROR_STEP = 'error';
const SUCCESS_STEP = 'success';
const BRAZE_NAME_EXISTS_ERROR = 'name already exists';

type CreateFlowProps = {
  sdk: DialogAppSDK;
  entry: Entry;
  invocationParams: InvocationParams;
  initialSelectedFields?: string[];
  initialSelectedLocales?: string[];
};

export type ContentBlockData = {
  names: Record<string, string>;
  descriptions: Record<string, string>;
};

export type CreationResultField = {
  fieldId: string;
  locale?: string;
  success: boolean;
  statusCode: number;
  message: string;
};

const CreateFlow = (props: CreateFlowProps) => {
  const { sdk, entry, initialSelectedFields = [], initialSelectedLocales = [] } = props;
  const [step, setStep] = useState(FIELDS_STEP);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(initialSelectedFields));
  const [selectedLocales, setSelectedLocales] = useState<string[]>(initialSelectedLocales);
  const [creationResultFields, setCreationResultFields] = useState<CreationResultField[]>([]);
  const [contentBlocksData, setContentBlocksData] = useState<ContentBlockData>({
    names: {},
    descriptions: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locales = sdk.locales.available;

  const shouldChooseLocales = (selectedFields: Set<string>): boolean => {
    return (
      locales.length > 1 &&
      Array.from(selectedFields).some(
        (fieldId) => entry.fields.find((f) => f.id === fieldId)?.localized
      )
    );
  };

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

  const getFieldsToCreate = (data: ContentBlockData) => {
    const fieldsToCreate = [];
    const contentBlockAlreadyCreated = (fieldId: string, locale?: string) => {
      return creationResultFields.some(
        (result) =>
          result.success && result.fieldId === fieldId && (locale ? result.locale === locale : true)
      );
    };

    for (const fieldId of Array.from(selectedFields)) {
      const fieldIsLocalized = entry.fields.find((f) => f.id === fieldId)?.localized;
      if (shouldChooseLocales(selectedFields) && fieldIsLocalized) {
        for (const locale of selectedLocales) {
          if (contentBlockAlreadyCreated(fieldId, locale)) {
            continue;
          }

          const localizedFieldId = localizeFieldId(fieldId, locale);
          fieldsToCreate.push({
            fieldId,
            locale,
            contentBlockName: data.names[localizedFieldId],
            contentBlockDescription: data.descriptions[localizedFieldId],
          });
        }
      } else {
        if (contentBlockAlreadyCreated(fieldId)) {
          continue;
        }
        fieldsToCreate.push({
          fieldId,
          contentBlockName: data.names[fieldId],
          contentBlockDescription: data.descriptions[fieldId],
        });
      }
    }
    return fieldsToCreate;
  };

  const updateConnectedFields = async (responseData: { results: CreationResultField[] }) => {
    const newFields = responseData.results
      .filter((result: any) => result.success)
      .map((result: any) => {
        return {
          fieldId: result.fieldId,
          locale: result.locale,
          contentBlockId: result.contentBlockId,
        };
      });
    const configEntry = await getConfigEntry(cma);
    const connectedFields = configEntry.fields[CONFIG_FIELD_ID]?.[sdk.locales.default] || {};
    const entryConnectedFields: EntryConnectedFields = connectedFields[entry.id] || [];
    connectedFields[entry.id] = [...entryConnectedFields, ...newFields];
    await updateConfig(configEntry, connectedFields, cma, sdk.locales.default);
  };

  const handleCreate = async (data: ContentBlockData) => {
    if (entry.state !== EntryStatus.Published && step === CREATE_STEP) {
      setStep(DRAFT_STEP);
      return;
    } else if (step === DRAFT_STEP) {
      setCreationResultFields([]);
      setStep(CREATE_STEP);
    }

    setIsSubmitting(true);

    const fieldsToCreate = getFieldsToCreate(data);

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
            fieldsData: JSON.stringify(fieldsToCreate),
          },
        }
      );
      const responseData: { results: CreationResultField[] } = JSON.parse(response.response.body);

      await updateConnectedFields(responseData);

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
      if (step === DRAFT_STEP) {
        setStep(CREATE_STEP);
      }
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
          handleNextStep={() =>
            setStep(shouldChooseLocales(selectedFields) ? LOCALES_STEP : CREATE_STEP)
          }
        />
      )}
      {step === LOCALES_STEP && (
        <LocalesSelectionStep
          locales={locales}
          selectedLocales={selectedLocales}
          setSelectedLocales={setSelectedLocales}
          handlePreviousStep={() => setStep(FIELDS_STEP)}
          handleNextStep={() => setStep(CREATE_STEP)}
        />
      )}
      {step === CREATE_STEP && (
        <CreateStep
          entry={entry}
          selectedFields={selectedFields}
          selectedLocales={shouldChooseLocales(selectedFields) ? selectedLocales : undefined}
          isSubmitting={isSubmitting}
          handlePreviousStep={() =>
            setStep(shouldChooseLocales(selectedFields) ? LOCALES_STEP : FIELDS_STEP)
          }
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
          createdFields={creationResultFields.filter((result) => result.success).length}
          handleClose={() => sdk.close({ step: 'close' })}
        />
      )}
    </Box>
  );
};

export default CreateFlow;
