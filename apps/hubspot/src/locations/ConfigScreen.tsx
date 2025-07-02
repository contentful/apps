import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Collapse,
  Flex,
  Form,
  FormControl,
  Heading,
  IconButton,
  List,
  Note,
  Paragraph,
  Subheading,
  Text,
  TextInput,
  TextLink,
} from '@contentful/f36-components';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import Splitter from '../components/Splitter';
import { styles } from './ConfigScreen.styles';
import {
  AppInstallationParameters,
  CONFIG_SCREEN_INSTRUCTIONS,
  ContentType,
  createConfig,
  HUBSPOT_PRIVATE_APPS_URL,
} from '../utils/utils';
import { createClient } from 'contentful-management';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';

export const EMPTY_MESSAGE = 'Some fields are missing';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hubspotTokenError, setHubspotTokenError] = useState<string | null>(null);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    hubspotAccessToken: '',
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  function checkIfHasValue(
    value: string,
    setError: (error: string | null) => void,
    errorMessage: string
  ) {
    const hasValue = !!value?.trim();
    setError(hasValue ? null : errorMessage);
    return hasValue;
  }

  const validateAccessToken = async () => {
    setHubspotTokenError(null);

    const hubspotTokenHasValue = checkIfHasValue(
      parameters.hubspotAccessToken,
      setHubspotTokenError,
      EMPTY_MESSAGE
    );

    if (!hubspotTokenHasValue) {
      sdk.notifier.error(EMPTY_MESSAGE);
      return false;
    }

    try {
      const response = await cma.appActionCall.createWithResponse(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
          appDefinitionId: sdk.ids.app!,
          appActionId: 'validateHubspotToken',
        },
        {
          parameters: {
            token: parameters.hubspotAccessToken,
          },
        }
      );

      const responseData = JSON.parse(response.response.body);

      if (responseData.error) {
        setHubspotTokenError(responseData.error);
        sdk.notifier.error(responseData.error);
        return false;
      }
    } catch (error) {
      setHubspotTokenError('Error validating HubSpot token');
      sdk.notifier.error('Error validating HubSpot token');
      return false;
    }
    return true;
  };

  const onConfigure = useCallback(async () => {
    const isTokenValid = await validateAccessToken();
    if (!isTokenValid) {
      return false;
    }

    try {
      await createConfig(cma);
    } catch (e) {
      console.error(e);
      sdk.notifier.error('Error creating configuration entry');
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

    return {
      parameters,
      targetState: { EditorInterface: { ...editorInterface } },
    };
  }, [parameters, sdk, cma, selectedContentTypes]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters && currentParameters.hubspotAccessToken) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex justifyContent="center" alignItems="center">
      <Box className={styles.body}>
        <Heading marginBottom="spacingS">Set up Hubspot</Heading>
        <Paragraph marginBottom="spacing2Xs">
          Seamlessly sync Contentful entry content to email campaigns in Hubspot. Map entry fields
          to custom email modules in Hubspot to continuously and automatically keep content
          consistent at scale.
        </Paragraph>
        <Box marginTop="spacingS" marginBottom="spacing2Xl">
          <Note variant="neutral">
            The Hubspot app will create a content type labeled "hubspotConfig". Do not delete or
            modify manually.
          </Note>
        </Box>
        <Box marginTop="spacingXl" marginBottom="spacingXs">
          <Subheading marginBottom="spacingXs">Configure access</Subheading>
          <Paragraph marginBottom="spacingL">
            To connect your organization's Hubspot account, enter the private app access token.
          </Paragraph>
          <Form>
            <FormControl isRequired marginBottom="none">
              <FormControl.Label>Private app access token</FormControl.Label>
              <TextInput
                name="hubspotAccessToken"
                placeholder="Enter your access token"
                value={parameters.hubspotAccessToken}
                onChange={(e) =>
                  setParameters({ ...parameters, hubspotAccessToken: e.target.value })
                }
                isRequired
                type="password"
                data-testid="hubspotAccessToken"
              />
            </FormControl>
            {hubspotTokenError && (
              <FormControl.ValidationMessage marginBottom="spacingS">
                {hubspotTokenError}
              </FormControl.ValidationMessage>
            )}
          </Form>
        </Box>
        <Splitter marginBottom="spacing2Xs" />
        <Box padding="spacingXs">
          <Flex alignItems="center" justifyContent="space-between">
            <Text>Instructions to create a private app access token in Hubspot</Text>
            <IconButton
              variant="transparent"
              aria-label={isExpanded ? 'Collapse instructions' : 'Expand instructions'}
              icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={() => setIsExpanded((v) => !v)}
              size="small"
            />
          </Flex>
          <Collapse isExpanded={isExpanded}>
            <Paragraph marginBottom="none" fontColor="gray500">
              To create a private app access token:
            </Paragraph>
            <List as="ol" className={styles.orderList}>
              {CONFIG_SCREEN_INSTRUCTIONS.map((step, i) => (
                <List.Item key={i} className={styles.listItem}>
                  {step}
                </List.Item>
              ))}
            </List>
            <Box marginTop="spacingS">
              <TextLink
                href={HUBSPOT_PRIVATE_APPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkIcon />}
                alignIcon="end">
                Read about creating private apps in Hubspot
              </TextLink>
            </Box>
          </Collapse>
        </Box>
        <Splitter marginTop="spacing2Xs" marginBottom="spacing2Xl" />
        <Subheading marginBottom="spacing2Xs">Assign content types</Subheading>
        <Paragraph marginBottom="spacingM">
          The Hubspot integration will be enabled for content types you assign, and the sidebar
          widget will show up on these entry pages.
        </Paragraph>
        <Text fontWeight="fontWeightDemiBold">Content types</Text>
        <ContentTypeMultiSelect
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={sdk}
          cma={cma}
        />
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
