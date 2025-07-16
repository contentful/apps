import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Paragraph, Flex, FormControl, Box, TextLink } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import ContentfulApiKeyInput, {
  validateContentfulApiKey,
} from '../components/ContentfulApiKeyInput';

import { ExternalLinkIcon } from '@contentful/f36-icons';
import { ContentType, ITERABLE_DOCUMENTATION } from '../utils';
import { configScreenContainer } from './ConfigScreen.styles';
interface AppInstallationParameters {
  contentfulApiKey: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    contentfulApiKey: '',
  });
  const [contentfulApiKeyIsValid, setContentfulApiKeyIsValid] = useState(true);
  const sdk = useSDK<ConfigAppSDK>();
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);

  const onConfigure = useCallback(async () => {
    const isContentfulKeyValid = await validateContentfulApiKey(parameters.contentfulApiKey, sdk);
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
      if (currentParameters && currentParameters.contentfulApiKey) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParameters({ ...parameters, contentfulApiKey: e.target.value.trim() });
  };

  return (
    <Flex justifyContent="center" alignItems="flex-start" className={configScreenContainer}>
      <Box margin="spacing2Xl">
        <Heading as="h2" marginBottom="spacingS">
          Set up Iterable
        </Heading>
        <Paragraph marginBottom="spacingXl">
          Sync content directly from Contentful to Iterable, reducing manual work, ensuring brand
          consistency, and accelerating campaign creation.
        </Paragraph>
        <Box marginBottom="spacing2Xl">
          <Box marginBottom="spacingL">
            <Heading as="h3" marginBottom="spacingXs">
              Configure access
            </Heading>
            <Paragraph marginBottom="spacing2Xs">
              Input the Contentful Delivery API - access token that Iterable will use to request
              your content via API at send time.
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
          <ContentfulApiKeyInput
            value={parameters.contentfulApiKey}
            onChange={handleApiKeyChange}
            isInvalid={!contentfulApiKeyIsValid}
            dataTestId="contentfulApiKey"
          />
        </Box>
        <Box marginBottom="spacing2Xl">
          <Heading as="h3" marginBottom="spacingXs">
            Assign content types
          </Heading>
          <Paragraph marginBottom="spacingL">
            The Iterable integration will only be enabled for the content types you assign. The
            sidebar widget will be displayed on these entry pages.
          </Paragraph>
          <FormControl id="contentTypes">
            <FormControl.Label>Content types</FormControl.Label>
            <ContentTypeMultiSelect
              selectedContentTypes={selectedContentTypes}
              setSelectedContentTypes={setSelectedContentTypes}
              sdk={sdk}
              cma={sdk.cma}
            />
          </FormControl>
        </Box>
        <Box>
          <Heading as="h3" marginBottom="spacingXs">
            Getting started
          </Heading>
          <Paragraph>
            Learn more about how to connect Contentful with Iterable and configure the Iterable app{' '}
            <TextLink
              target="_blank"
              rel="noopener noreferrer"
              alignIcon="end"
              href={ITERABLE_DOCUMENTATION}
              icon={<ExternalLinkIcon />}>
              here
            </TextLink>
            .
          </Paragraph>
        </Box>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
