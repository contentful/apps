import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Subheading,
  Text,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import ContentTypeFieldMultiSelect from '../components/ContentTypeFieldMultiSelect';
import { ContentTypeInfo, TargetState } from '../utils';
import { ValidateCredentialsResponse } from '../../functions/validateMarketoCredentials';
import {
  CONFIG_SAVE_FAILED_MESSAGE,
  CONFIG_SAVE_REQUIRED_FIELDS_MESSAGE,
  CREDENTIAL_VALIDATION,
  INSTALL_APP_FIRST_MESSAGE,
  INVALID_CREDENTIALS_RESPONSE,
  TEST_CONNECTION_REQUIRED_FIELDS_MESSAGE,
} from '../const';
import { AppInstallationParameters, ConnectionStatus } from '../types';

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    clientId: '',
    clientSecret: '',
    munchkinId: '',
    connectionStatus: ConnectionStatus.None,
    connectionMessage: '',
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeInfo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const sdk = useSDK<ConfigAppSDK>();

  const setConnectionParameters = (status: ConnectionStatus, message: string) => {
    setParameters((prev) => ({
      ...prev,
      connectionStatus: status,
      connectionMessage: message,
    }));
  };

  const callValidateCredentials = useCallback(
    async (params?: AppInstallationParameters): Promise<ValidateCredentialsResponse> => {
      let parameters = {};

      if (params?.clientId?.trim() && params?.clientSecret?.trim() && params?.munchkinId?.trim()) {
        parameters = {
          clientId: params?.clientId,
          clientSecret: params?.clientSecret,
          munchkinId: params?.munchkinId,
        };
      }

      try {
        const response = await sdk.cma.appActionCall.createWithResponse(
          { appDefinitionId: sdk.ids.app!, appActionId: 'validateMarketoCredentialsAction' },
          { parameters }
        );

        const data = JSON.parse(response.response.body) as ValidateCredentialsResponse;

        const status = data.valid ? ConnectionStatus.Success : ConnectionStatus.Error;
        setConnectionParameters(status, data.message);

        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : INVALID_CREDENTIALS_RESPONSE;
        setConnectionParameters(ConnectionStatus.Error, message);

        return { valid: false, message };
      }
    },
    [sdk]
  );

  const validateRequiredFields = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const credential of CREDENTIAL_VALIDATION) {
      const id = credential.id as keyof AppInstallationParameters;
      const message = credential.message;
      if (!parameters[id]?.trim()) newErrors[id] = message;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [parameters.clientId, parameters.clientSecret, parameters.munchkinId]);

  const onConfigure = useCallback(async () => {
    if (!validateRequiredFields()) {
      sdk.notifier.error(CONFIG_SAVE_REQUIRED_FIELDS_MESSAGE);
      return false;
    }

    const targetState: TargetState = {
      EditorInterface: {},
    };

    selectedContentTypes.forEach((field) => {
      if (!targetState.EditorInterface[field.contentTypeId]) {
        targetState.EditorInterface[field.contentTypeId] = { controls: [] };
      }
      targetState.EditorInterface[field.contentTypeId].controls!.push({
        fieldId: field.fieldId,
      });
    });

    return {
      parameters,
      targetState,
    };
  }, [parameters, selectedContentTypes, sdk, validateRequiredFields]);

  const onConfigurationCompleted = useCallback(
    async (error: { message: string } | null) => {
      if (error) {
        sdk.notifier.error(CONFIG_SAVE_FAILED_MESSAGE);
        return;
      }
      const data = await callValidateCredentials();
      if (data.valid) {
        sdk.notifier.success(data.message);
      } else {
        sdk.notifier.error(data.message);
      }
      setIsInstalled(true);
    },
    [sdk, callValidateCredentials]
  );

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted((err) => onConfigurationCompleted(err));
  }, [sdk, onConfigure, onConfigurationCompleted]);

  useEffect(() => {
    (async () => {
      const [currentParameters, installed] = await Promise.all([
        sdk.app.getParameters() as Promise<AppInstallationParameters | null>,
        sdk.app.isInstalled(),
      ]);

      if (currentParameters) {
        setParameters(currentParameters);
      }

      setIsInstalled(installed);
      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ): void => {
    const id = event.target.id;
    const value = event.target.value;

    setParameters((prev) => ({
      ...prev,
      [id]: value,
      connectionStatus: ConnectionStatus.None,
      connectionMessage: '',
    }));

    // Clear error
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const testConnection = async (): Promise<void> => {
    if (!validateRequiredFields()) {
      sdk.notifier.error(TEST_CONNECTION_REQUIRED_FIELDS_MESSAGE);
      return;
    }

    const isInstalled = await sdk.app.isInstalled();
    if (!isInstalled) {
      sdk.notifier.error(INSTALL_APP_FIRST_MESSAGE);
      return;
    }

    setConnectionParameters(ConnectionStatus.Testing, '');

    await callValidateCredentials({
      clientId: parameters.clientId,
      clientSecret: parameters.clientSecret,
      munchkinId: parameters.munchkinId,
    });
  };

  return (
    <Flex fullWidth justifyContent="center">
      <Box className={styles.container}>
        <Form>
          <Heading marginBottom="spacingS">Set up the Adobe Marketo Form Selector App</Heading>
          <Paragraph marginBottom="spacingL">
            The Marketo app fetches available form IDs and titles directly from your account, making
            it easy for editors to select the right form from a dropdown in Contentful.
          </Paragraph>

          <Box marginBottom="spacingXl">
            <Subheading marginBottom="spacingM">Configure access</Subheading>

            <FormControl isRequired marginBottom="spacingM" isInvalid={!!errors.clientId}>
              <FormControl.Label htmlFor="clientId">Marketo Client ID</FormControl.Label>
              <TextInput
                id="clientId"
                name="clientId"
                type="password"
                value={parameters.clientId}
                onChange={handleFieldChange}
                isInvalid={!!errors.clientId}
              />
              {errors.clientId && (
                <FormControl.ValidationMessage>{errors.clientId}</FormControl.ValidationMessage>
              )}
              <TextLink
                className={styles.textLinkContainer}
                href="https://developers.marketo.com/rest-api/authentication/#creating_an_access_token"
                target="_blank"
                rel="noreferrer">
                How to find your Client ID
              </TextLink>
            </FormControl>

            <FormControl isRequired marginBottom="spacingM" isInvalid={!!errors.clientSecret}>
              <FormControl.Label htmlFor="clientSecret">Marketo Client Secret</FormControl.Label>
              <TextInput
                id="clientSecret"
                name="clientSecret"
                type="password"
                value={parameters.clientSecret}
                onChange={handleFieldChange}
                isInvalid={!!errors.clientSecret}
              />
              {errors.clientSecret && (
                <FormControl.ValidationMessage>{errors.clientSecret}</FormControl.ValidationMessage>
              )}
              <TextLink
                className={styles.textLinkContainer}
                href="https://developers.marketo.com/rest-api/authentication/#creating_an_access_token"
                target="_blank"
                rel="noreferrer">
                How to find your Client Secret
              </TextLink>
            </FormControl>

            <FormControl isRequired marginBottom="spacingM" isInvalid={!!errors.munchkinId}>
              <FormControl.Label htmlFor="munchkinId">Marketo Munchkin Id</FormControl.Label>
              <TextInput
                id="munchkinId"
                name="munchkinId"
                type="password"
                value={parameters.munchkinId}
                onChange={handleFieldChange}
                isInvalid={!!errors.munchkinId}
              />
              {errors.munchkinId && (
                <FormControl.ValidationMessage>{errors.munchkinId}</FormControl.ValidationMessage>
              )}
              <FormControl.HelpText>
                Your Munchkin ID is also the first part of the rest/identity endpoints as described{' '}
                <TextLink
                  href="https://developers.marketo.com/rest-api/authentication/#creating_an_access_token"
                  target="_blank"
                  rel="noreferrer">
                  here
                </TextLink>
                .
              </FormControl.HelpText>
              <FormControl.HelpText marginTop="none">
                For instance, for the url &quot;https://123-ABC-456.mktorest.com/identity&quot;,
                &quot;064-CCJ-768&quot; would be the Munchkin ID.
              </FormControl.HelpText>
              <TextLink
                className={styles.textLinkContainer}
                href="https://nation.marketo.com/t5/knowledgebase/how-to-find-your-munchkin-id-for-a-marketo-instance/ta-p/248432"
                target="_blank"
                rel="noreferrer">
                How to find your Munchkin ID
              </TextLink>
            </FormControl>

            {isInstalled && (
              <Box marginTop="spacingXl">
                <Card marginBottom="spacingS" className={styles.connectionCard}>
                  <Flex justifyContent="space-between" alignItems="center" gap="spacingM">
                    <Text fontWeight="fontWeightDemiBold" fontColor="gray800">
                      Marketo Connection
                    </Text>
                    <Flex alignItems="center" gap="spacingS">
                      {parameters.connectionStatus === ConnectionStatus.Success && (
                        <Badge variant="positive">Connected</Badge>
                      )}
                      {parameters.connectionStatus === ConnectionStatus.Error && (
                        <Badge variant="warning">Connection failed</Badge>
                      )}
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={testConnection}
                        isDisabled={parameters.connectionStatus === ConnectionStatus.Testing}
                        isLoading={parameters.connectionStatus === ConnectionStatus.Testing}>
                        Test
                      </Button>
                    </Flex>
                  </Flex>
                  {parameters.connectionStatus === ConnectionStatus.Error &&
                    parameters.connectionMessage && (
                      <Box marginTop="spacingS">
                        <Note variant="warning" title="Connection failed">
                          {parameters.connectionMessage}
                        </Note>
                      </Box>
                    )}
                </Card>
                <FormControl.HelpText marginTop="spacingS">
                  After testing the connection, click <strong>Save</strong> to store your Marketo
                  credentials.
                </FormControl.HelpText>
              </Box>
            )}
          </Box>

          <Box marginBottom="spacing4Xl">
            <Subheading marginBottom="spacingM">Assign content types</Subheading>
            <Paragraph marginBottom="spacingL">
              Select the content type(s) you want to use with the Marketo app. You can change this
              anytime by clicking &apos;Edit&apos; on the JSON object field type and adjust the
              Appearance settings in your content type.
            </Paragraph>
            <FormControl id="contentTypes">
              <FormControl.Label>Content types</FormControl.Label>
              <ContentTypeFieldMultiSelect
                selectedFields={selectedContentTypes}
                onSelectionChange={setSelectedContentTypes}
                sdk={sdk}
              />
            </FormControl>
          </Box>
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
