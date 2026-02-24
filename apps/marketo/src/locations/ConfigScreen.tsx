import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Flex,
  Form,
  FormControl,
  Heading,
  Note,
  Paragraph,
  Subheading,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';
import ContentTypeFieldMultiSelect from '../components/ContentTypeFieldMultiSelect';
import { ContentTypeInfo, TargetState } from '../utils';
import { ValidateCredentialsResponse } from '../../functions/validateMarketoCredentials';

export interface AppParameters {
  clientId?: string;
  clientSecret?: string;
  munchkinId?: string;
}

const CREDENTIAL_VALIDATION: { id: keyof AppParameters; message: string }[] = [
  { id: 'clientId', message: 'Enter a valid Client ID' },
  { id: 'clientSecret', message: 'Enter a valid Client Secret' },
  { id: 'munchkinId', message: 'Enter a valid Munchkin ID' },
];

enum ConnectionStatus {
  None = 'none',
  Testing = 'testing',
  Success = 'success',
  Error = 'error',
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppParameters>({
    clientId: '',
    clientSecret: '',
    munchkinId: '',
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeInfo[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.None);
  const [connectionMessage, setConnectionMessage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sdk = useSDK<ConfigAppSDK>();

  const callValidateCredentials = useCallback(
    async (params?: AppParameters) => {
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

        setConnectionStatus(data.valid ? ConnectionStatus.Success : ConnectionStatus.Error);
        setConnectionMessage(
          data.valid
            ? data.message ?? 'Connection successful. Your Marketo credentials are valid.'
            : data.message ?? 'Unexpected response from Marketo.'
        );
      } catch {
        setConnectionStatus(ConnectionStatus.Error);
        setConnectionMessage(
          'Connection failed. Please check your Client ID, Client Secret and Munchkin ID and try again.'
        );
      }
    },
    [sdk]
  );

  const validateCredentials = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const { id, message } of CREDENTIAL_VALIDATION) {
      if (!parameters[id]?.trim()) newErrors[id] = message;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [parameters.clientId, parameters.clientSecret, parameters.munchkinId]);

  const onConfigure = useCallback(async () => {
    if (!validateCredentials()) {
      sdk.notifier.error('Please fill in all required fields with valid values before saving.');
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
  }, [parameters, selectedContentTypes, sdk, validateCredentials]);

  const onConfigurationCompleted = useCallback(
    async (error: { message: string } | null) => {
      if (error) {
        sdk.notifier.error('Configuration could not be saved.');
        return;
      }
      await callValidateCredentials();
    },
    [sdk, callValidateCredentials]
  );

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted((err) => onConfigurationCompleted(err));
  }, [sdk, onConfigure, onConfigurationCompleted]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleFieldChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ): void => {
    const id = event.target.id;
    const value = event.target.value;

    setParameters((prev) => ({ ...prev, [id]: value }));

    // Clear error and status
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
    setConnectionStatus(ConnectionStatus.None);
    setConnectionMessage('');
  };

  const testConnection = async (): Promise<void> => {
    if (!validateCredentials()) {
      sdk.notifier.error('Please fill in all required fields before testing the connection.');
      return;
    }

    const isInstalled = await sdk.app.isInstalled();
    if (!isInstalled) {
      sdk.notifier.error('Please install the app first.');
      return;
    }

    setConnectionStatus(ConnectionStatus.Testing);

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
          <Heading marginBottom="spacingS">Set up the Marketo App</Heading>
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
                For instance, for the url &quot;https://123-ABC-456.mktorest.com/identitity&quot;,
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

            <Box marginTop="spacingXl">
              <Button
                onClick={testConnection}
                isLoading={connectionStatus === ConnectionStatus.Testing}
                isDisabled={connectionStatus === ConnectionStatus.Testing}>
                Test marketo connection
              </Button>
              {connectionStatus === ConnectionStatus.Success && connectionMessage && (
                <Box marginTop="spacingM">
                  <Note variant="positive" title="Connection successful">
                    {connectionMessage}
                  </Note>
                </Box>
              )}
              {connectionStatus === ConnectionStatus.Error && connectionMessage && (
                <Box marginTop="spacingM">
                  <Note variant="negative" title="Connection failed">
                    {connectionMessage}
                  </Note>
                </Box>
              )}
            </Box>
          </Box>

          <Box>
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
