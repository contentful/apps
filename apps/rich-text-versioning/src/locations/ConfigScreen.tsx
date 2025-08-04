import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Box,
  Flex,
  Form,
  FormControl,
  Heading,
  HelpText,
  Note,
  Paragraph,
  TextInput,
  TextLink,
  ValidationMessage,
} from '@contentful/f36-components';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { useCallback, useEffect, useState } from 'react';
import { styles } from './ConfigScreen.styles';

export interface AppInstallationParameters {
  apiToken?: string;
  selectedContentTypes?: string[];
}

interface ContentType {
  sys: {
    id: string;
  };
  name: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  const fetchAllContentTypes = useCallback(async (): Promise<ContentType[]> => {
    let allContentTypes: ContentType[] = [];
    let skip = 0;
    const limit = 1000;
    let areMoreContentTypes = true;

    while (areMoreContentTypes) {
      const response = await cma.contentType.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query: { skip, limit },
      });
      if (response.items) {
        allContentTypes = allContentTypes.concat(response.items);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    return allContentTypes;
  }, [cma, sdk.ids.space, sdk.ids.environment]);

  const loadContentTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allContentTypes = await fetchAllContentTypes();
      setContentTypes(allContentTypes);
    } catch (err) {
      setError('Error loading content types');
      console.error('Failed to load content types:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAllContentTypes]);

  const onConfigure = useCallback(async () => {
    // Validate required fields
    if (!parameters.apiToken?.trim()) {
      setValidationError('API token is required');
      return false;
    }

    setValidationError(null);

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Load content types
      await loadContentTypes();

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk, loadContentTypes]);

  const handleApiTokenChange = useCallback(
    (value: string) => {
      setParameters((prev) => ({ ...prev, apiToken: value }));
      if (validationError) {
        setValidationError(null);
      }
    },
    [validationError]
  );

  return (
    <Flex justifyContent="center" alignItems="flex-start" className={styles.configScreenContainer}>
      <Box margin="spacing2Xl">
        <Heading as="h2" marginBottom="spacingS">
          Set up Rich Text Versioning
        </Heading>
        <Paragraph marginBottom="spacingXl">
          This app allows content creators to visually compare changes in a rich text field against
          the last published version. A two-column view highlights added, removed, and modified
          content, including referenced entries and assets.
        </Paragraph>

        {/* Configure Access Section */}
        <Box marginBottom="spacing2Xl">
          <Box marginBottom="spacingL">
            <Heading as="h3" marginBottom="spacingXs">
              Configure access
            </Heading>
            <Paragraph marginBottom="spacing2Xs">
              Input the Contentful Delivery API - access token that will be used to request your
              content via API at send time.
            </Paragraph>
            <Box marginBottom="spacingM">
              <TextLink
                href={`https://app.contentful.com/spaces/${sdk.ids.space}/api/keys`}
                target="_blank"
                rel="noopener noreferrer"
                alignIcon="end"
                icon={<ExternalLinkIcon />}>
                Manage API keys
              </TextLink>
            </Box>
          </Box>
          <FormControl isRequired isInvalid={!!validationError}>
            <FormControl.Label>Contentful Delivery API - access token</FormControl.Label>
            <TextInput
              type="password"
              value={parameters.apiToken || ''}
              onChange={(e) => handleApiTokenChange(e.target.value)}
              placeholder="ex. 0ab1c234DE56f..."
              isInvalid={!!validationError}
              isRequired
            />
            {validationError && (
              <FormControl.ValidationMessage>{validationError}</FormControl.ValidationMessage>
            )}
            <HelpText>This token will be used to fetch content for comparison purposes.</HelpText>
          </FormControl>
        </Box>

        {/* Assign Content Types Section */}
        <Box marginBottom="spacing2Xl">
          <Heading as="h3" marginBottom="spacingXs">
            Assign content types
          </Heading>
          <Paragraph marginBottom="spacingL">
            Select the content type(s) you want to use with Rich Text Versioning. You can change
            this anytime by clicking 'Edit' on the rich text field type and adjust the Appearance
            settings in your content type.
          </Paragraph>
          <FormControl id="contentTypes">
            <FormControl.Label>Content types</FormControl.Label>
            {loading ? (
              <Box marginBottom="spacingM">
                <Paragraph>Loading content types...</Paragraph>
              </Box>
            ) : error ? (
              <Box marginBottom="spacingM">
                <Paragraph>{error}</Paragraph>
              </Box>
            ) : contentTypes.length === 0 ? (
              <Box marginBottom="spacingM">
                <Paragraph>No content types found</Paragraph>
              </Box>
            ) : (
              // TODO: Implement content type selection checkboxes in the next step
              <Box marginBottom="spacingM">
                <Note variant="neutral">
                  {contentTypes.length} content type(s) loaded successfully. Selection functionality
                  will be implemented next.
                </Note>
              </Box>
            )}
          </FormControl>
        </Box>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
