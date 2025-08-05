import { Box, Button, Flex } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useMemo, useState, useEffect } from 'react';
import FieldSelection from '../components/FieldSelection';
import FieldModuleNameMapping from '../components/FieldModuleNameMapping';
import { SdkField, SelectedSdkField } from '../utils/fieldsProcessing';
import { styles } from './Dialog.styles';
import ConfigEntryService from '../utils/ConfigEntryService';

export type InvocationParams = {
  entryTitle: string;
  entryId: string;
  fields: SdkField[];
};

enum Step {
  FieldSelection,
  ModuleNameMapping,
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParams;
  const fields = invocationParams.fields;
  const entryTitle = invocationParams.entryTitle;
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [step, setStep] = useState<Step>(Step.FieldSelection);
  const [moduleNameMapping, setModuleNameMapping] = useState<{ [fieldId: string]: string }>({});
  const [isSending, setIsSending] = useState(false);
  const [connectedFieldIds, setConnectedFieldIds] = useState<string[]>([]);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

  useEffect(() => {
    const fetchConnectedFields = async () => {
      const configService = new ConfigEntryService(sdk.cma, sdk.locales.default);
      const entryConnectedFields = await configService.getEntryConnectedFields(
        invocationParams.entryId
      );

      const ids = entryConnectedFields.map((f) =>
        f.locale ? `${f.fieldId}-${f.locale}` : f.fieldId
      );

      setConnectedFieldIds(ids);
    };
    fetchConnectedFields();
  }, []);

  const selectedFieldObjects = useMemo(
    () => fields.filter((f) => selectedFields.includes(f.uniqueId)),
    [selectedFields]
  );

  const initializeModuleNameMapping = () => {
    const initialNameMapping: { [fieldId: string]: string } = {};
    selectedFieldObjects.forEach((field) => {
      const updatedEntryTitle = entryTitle.replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '');
      const updatedFieldName = field.name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '');
      const locale = field.locale ? `-${field.locale}` : '';
      initialNameMapping[field.uniqueId] =
        moduleNameMapping[field.uniqueId] ?? `${updatedEntryTitle}-${updatedFieldName}${locale}`;
    });
    setModuleNameMapping(initialNameMapping);
  };

  const handleNext = () => {
    initializeModuleNameMapping();
    setStep(Step.ModuleNameMapping);
  };

  const handleCancel = () => {
    sdk.close();
  };

  const handleSaveAndSync = async () => {
    setIsSending(true);
    const fieldsToSend: SelectedSdkField[] = selectedFieldObjects.map((field) => {
      return { ...field, moduleName: moduleNameMapping[field.uniqueId] };
    });

    try {
      const response = await sdk.cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'createModulesAction',
        },
        {
          parameters: {
            entryId: invocationParams.entryId,
            fields: JSON.stringify(fieldsToSend),
          },
        }
      );
      const { successQuantity, failedQuantity, invalidToken, missingScopes } = JSON.parse(
        response.response.body
      );
      showResults(successQuantity, failedQuantity, invalidToken, missingScopes);
    } catch (error) {
      console.error('Error creating modules: ', error);
    } finally {
      setIsSending(false);
    }
  };

  const showResults = (
    successQuantity: number,
    failedQuantity: number,
    invalidToken: boolean,
    missingScopes: boolean
  ) => {
    const resultMessage = (fieldsQuantity: number): string => {
      return `${fieldsQuantity} entry field${fieldsQuantity === 1 ? '' : 's'}`;
    };

    const successMessage = `${resultMessage(successQuantity)} successfully synced.`;
    const failedMessage = `${resultMessage(failedQuantity)} did not sync, please try again.`;
    const errorMessage =
      'There is an error with your Hubspot private app access token, and entry fields did not sync.';

    if (invalidToken || missingScopes) {
      sdk.notifier.error(errorMessage);
    } else if (failedQuantity > 0 && successQuantity > 0) {
      sdk.notifier.warning(`${successMessage} ${failedMessage}`);
    } else if (failedQuantity > 0) {
      sdk.notifier.error(failedMessage);
    } else {
      sdk.notifier.success(successMessage);
    }

    if (invalidToken || missingScopes) {
      sdk.close(true);
    } else {
      sdk.close(false);
    }
  };

  return (
    <Box margin="spacingL" marginTop="spacingM">
      {step === Step.FieldSelection && (
        <>
          <FieldSelection
            fields={fields}
            selectedFields={selectedFields}
            setSelectedFields={setSelectedFields}
            connectedFieldIds={connectedFieldIds}
          />
          <Flex
            paddingTop="spacingM"
            paddingBottom="spacingM"
            gap="spacingM"
            justifyContent="end"
            className={styles.footer}>
            <Button variant="negative" size="small" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleNext}
              isDisabled={selectedFields.length === 0}>
              Next
            </Button>
          </Flex>
        </>
      )}
      {step === Step.ModuleNameMapping && (
        <>
          <FieldModuleNameMapping
            selectedFields={selectedFieldObjects}
            moduleNameMapping={moduleNameMapping}
            setModuleNameMapping={setModuleNameMapping}
            inputDisabled={isSending}
            onValidationChange={(isValid) => setHasValidationErrors(isValid)}
          />
          <Flex
            paddingTop="spacingM"
            paddingBottom="spacingM"
            gap="spacingM"
            justifyContent="end"
            className={styles.footer}>
            <Button variant="negative" size="small" isDisabled={isSending} onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setStep(Step.FieldSelection)}
              isDisabled={isSending}>
              Previous
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSaveAndSync}
              isDisabled={isSending || hasValidationErrors}
              isLoading={isSending}>
              Save and sync
            </Button>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default Dialog;
