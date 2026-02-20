import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Button,
  Flex,
  Form,
  FormControl,
  Heading,
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

export interface AppInstallationParameters {
  clientId?: string;
  clientSecret?: string;
  munchkinId?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    clientId: '',
    clientSecret: '',
    munchkinId: '',
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentTypeInfo[]>([]);
  const [loading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sdk = useSDK<ConfigAppSDK>();

  const validateInput = (errors: Record<string, string>, id: string, value?: string): void => {
    if (!value?.trim()) {
      errors[id] = `Input is required`;
    }
  };

  const onConfigure = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    validateInput(newErrors, 'clientId', parameters.clientId);
    validateInput(newErrors, 'clientSecret', parameters.clientSecret);
    validateInput(newErrors, 'munchkinId', parameters.munchkinId);

    const isValid = Object.keys(newErrors).length === 0;
    setErrors(newErrors);

    if (!isValid) {
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
  }, [parameters, selectedContentTypes, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

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

    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const testConnection = async (): Promise<void> => {
    // TODO : IMPLEMENT
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
              <Button onClick={testConnection} isLoading={loading}>
                Test marketo connection
              </Button>
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
