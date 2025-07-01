import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK, ContentType } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Paragraph,
  Flex,
  FormControl,
  HelpText,
  Box,
} from '@contentful/f36-components';
import { css } from 'emotion';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import ContentfulApiKeyInput, {
  validateContentfulApiKey,
} from '../components/ContentfulApiKeyInput';
import { useCMA } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  accessToken: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    accessToken: '',
  });
  const [contentfulApiKeyIsValid, setContentfulApiKeyIsValid] = useState(true);
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);

  const onConfigure = useCallback(async () => {
    const isContentfulKeyValid = await validateContentfulApiKey(parameters.accessToken, sdk);
    setContentfulApiKeyIsValid(isContentfulKeyValid);

    if (!isContentfulKeyValid) {
      sdk.notifier.error('Some fields are missing or invalid');
      return false;
    }

    const editorInterface = selectedContentTypes.reduce((acc, contentType) => {
      return {
        ...acc,
        [contentType.id]: {
          sidebar: { position: 0 },
        },
      };
    }, {});

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: {
        ...currentState,
        EditorInterface: editorInterface,
      },
    };
  }, [parameters, sdk, selectedContentTypes]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex
      justifyContent="center"
      alignItems="flex-start"
      style={{ minHeight: '100vh', background: 'transparent' }}>
      <Box margin="spacingL">
        <Heading as="h2" marginBottom="spacingM">
          Set up Iterable
        </Heading>
        <Paragraph marginBottom="spacingL">
          Sync content directly from Contentful to Iterable, reducing manual work, ensuring brand
          consistency, and accelerating campaign creation.
        </Paragraph>

        {/* Configure access section */}
        <Box marginBottom="spacing2Xl">
          <ContentfulApiKeyInput
            value={parameters.accessToken}
            onChange={(e) => setParameters({ ...parameters, accessToken: e.target.value })}
            spaceId={sdk.ids.space}
            isInvalid={!contentfulApiKeyIsValid}
            dataTestId="contentfulApiKey"
          />
        </Box>

        {/* Assign content types section */}
        <Box marginBottom="spacing2Xl">
          <Heading as="h3" marginBottom="spacingXs">
            Assign content types
          </Heading>
          <Paragraph marginBottom="spacingS">
            The Iterable integration will only be enabled for the content types you assign. The
            sidebar widget will be displayed on these entry pages.
          </Paragraph>
          <FormControl id="contentTypes" marginBottom="spacingM">
            <FormControl.Label>Content types</FormControl.Label>
            <ContentTypeMultiSelect
              selectedContentTypes={selectedContentTypes}
              setSelectedContentTypes={setSelectedContentTypes}
              sdk={sdk}
              cma={cma}
            />
            <HelpText>Select one or more</HelpText>
          </FormControl>
        </Box>

        {/* Getting started section */}
        <Box>
          <Heading as="h3" marginBottom="spacingXs">
            Getting started
          </Heading>
          <Paragraph>Add copy here</Paragraph>
        </Box>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
