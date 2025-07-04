import { Box, Button, Flex } from '@contentful/f36-components';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { useMemo, useState } from 'react';
import FieldSelection from '../components/FieldSelection';
import FieldModuleNameMapping from '../components/FieldModuleNameMapping';
import { createClient } from 'contentful-management';
import { SdkField, SelectedSdkField } from '../utils/fieldsProcessing';
import { styles } from './Dialog.styles';
import { MODULE_NAME_PATTERN } from '../utils/utils';

export type InvocationParams = {
  entryTitle: string;
  fields: SdkField[];
};

enum Step {
  FieldSelection,
  ModuleNameMapping,
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
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
  useAutoResizer();
  const invocationParams = sdk.parameters.invocation as unknown as InvocationParams;
  const fields = invocationParams.fields;
  const entryTitle = invocationParams.entryTitle;
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [step, setStep] = useState<Step>(Step.FieldSelection);
  const [moduleNameMapping, setModuleNameMapping] = useState<{ [fieldId: string]: string }>({});
  const [isSending, setIsSending] = useState(false);

  const selectedFieldObjects = useMemo(
    () => fields.filter((f) => selectedFields.includes(f.uniqueId)),
    [selectedFields]
  );

  const initializeModuleNameMapping = () => {
    const initialNameMapping: { [fieldId: string]: string } = {};
    selectedFieldObjects.forEach((field) => {
      const updatedEntryTitle = entryTitle.replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '');
      const updatedFieldName = field.name.replace(/\s+/g, '-').replace(/[^A-Za-z0-9_-]/g, '');
      initialNameMapping[field.uniqueId] =
        moduleNameMapping[field.uniqueId] ?? `${updatedEntryTitle}_${updatedFieldName}`;
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
      const response = await cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'createModulesAction',
        },
        {
          parameters: {
            fields: JSON.stringify(fieldsToSend),
          },
        }
      );
      const { success, failed, invalidToken, missingScopes } = JSON.parse(response.response.body);
      showResults(success, failed, invalidToken, missingScopes);
      sdk.close();
    } catch (error) {
      console.error('Error creating modules: ', error);
    } finally {
      setIsSending(false);
    }
  };

  const showResults = (
    success: SelectedSdkField[] = [],
    failed: SelectedSdkField[] = [],
    invalidToken: boolean,
    missingScopes: boolean
  ) => {
    const successMessage = `${success.length} entry field${
      success.length === 1 ? '' : 's'
    } successfully synced`;
    const failedMessage = `${failed.length} entry field${
      failed.length === 1 ? '' : 's'
    } did not sync, please try again`;
    const mixedMessage = `${successMessage} but ${failedMessage}`;

    if (invalidToken) {
      sdk.notifier.error('Invalid Hubspot access token.');
    } else if (missingScopes) {
      sdk.notifier.error('The Hubspot token is missing the required "content" scope.');
    } else if (failed.length > 0 && success.length > 0) {
      sdk.notifier.warning(mixedMessage);
    } else if (failed.length > 0) {
      sdk.notifier.error(`${failedMessage}.`);
    } else {
      sdk.notifier.success(`${successMessage}.`);
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
              isDisabled={
                isSending ||
                Object.values(moduleNameMapping).some(
                  (moduleName) => !MODULE_NAME_PATTERN.test(moduleName)
                )
              }
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
