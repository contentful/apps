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
  Image,
} from '@contentful/f36-components';
import demoVideo from '../assets/hubspot.mp4';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Splitter } from 'shared-components';
import { IMAGE_HEIGHT, IMAGE_WIDTH, styles } from './ConfigScreen.styles';
import {
  AppInstallationParameters,
  CONFIG_SCREEN_INSTRUCTIONS,
  ContentType,
  HUBSPOT_PRIVATE_APPS_URL,
} from '../utils/utils';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';
import ConfigEntryService from '../utils/ConfigEntryService';
import sidebarExample from '../assets/sidebar-example.png';
import pageTableExample from '../assets/page-table-example.png';
import hubspotModuleExample from '../assets/hubspot-module-example.png';

export const EMPTY_MESSAGE = 'Some fields are missing';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hubspotTokenError, setHubspotTokenError] = useState<string | null>(null);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    hubspotAccessToken: '',
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);

  function checkIfHasValue(value: string) {
    return !!value?.trim();
  }

  const validateAccessToken = async () => {
    setHubspotTokenError(null);

    const hubspotTokenHasValue = checkIfHasValue(parameters.hubspotAccessToken);

    if (!hubspotTokenHasValue) {
      setHubspotTokenError(EMPTY_MESSAGE);
      sdk.notifier.error(EMPTY_MESSAGE);
      return false;
    } else {
      setHubspotTokenError(null);
    }
    return true;
  };

  const onConfigure = useCallback(async () => {
    const isTokenValid = await validateAccessToken();
    if (!isTokenValid) {
      return false;
    }

    try {
      const configService = new ConfigEntryService(sdk.cma, sdk.locales.default);
      await configService.createConfig();
    } catch (e) {
      sdk.notifier.error('The app configuration was not saved. Please try again.');
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
  }, [parameters, sdk, selectedContentTypes]);

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
          to custom email modules in Hubspot to automatically keep content consistent at scale.
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
                  setParameters({ ...parameters, hubspotAccessToken: e.target.value.trim() })
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
            <Box marginTop="spacingS" marginBottom="spacingS">
              <TextLink
                href={HUBSPOT_PRIVATE_APPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkIcon />}
                alignIcon="end">
                Read about creating private apps in Hubspot.
              </TextLink>
            </Box>
            <video controls width="100%">
              <source src={demoVideo} type="video/mp4" />
            </video>
          </Collapse>
        </Box>
        <Splitter marginTop="spacing2Xs" marginBottom="spacing2Xl" />
        <Subheading marginBottom="spacing2Xs">Assign content types</Subheading>
        <Paragraph marginBottom="spacingM">
          The Hubspot integration will only be enabled for the content types you assign. The sidebar
          widget will be displayed on these entry pages.
        </Paragraph>
        <Text fontWeight="fontWeightDemiBold">Content types</Text>
        <ContentTypeMultiSelect
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          sdk={sdk}
        />
        <Subheading marginTop="spacing2Xl" marginBottom="spacingS">
          Getting started
        </Subheading>
        <Paragraph marginBottom="spacingM">
          The Hubspot integration will only be enabled for the content types you assign. The sidebar
          widget will be displayed on these entry pages.
        </Paragraph>
        <Flex flexDirection="column" gap="spacingM">
          <GettingStartedStep
            title="1. After you install the app, you can sync content from the entry editor sidebar."
            image={sidebarExample}
            alt="Contentful Sidebar with sync button."
          />
          <GettingStartedStep
            title="2. You can manage all synced content from the app’s full page location."
            image={pageTableExample}
            alt="Contentful Page view with table of synced content."
          />
          <GettingStartedStep
            title="3. In Hubspot, synced content will appear as modules within the Design manager, and within the Email editor."
            image={hubspotModuleExample}
            alt="Hubspot Design manager with synced modules."
          />
        </Flex>
      </Box>
    </Flex>
  );
};

const GettingStartedStep = ({
  title,
  image,
  alt,
}: {
  title: string;
  image: string;
  alt: string;
}) => {
  return (
    <Flex className={styles.itemContainer}>
      <Text marginBottom="spacingXs">{title}</Text>
      <Flex className={styles.imageContainer} marginLeft="spacingM">
        <Image src={image} alt={alt} height={IMAGE_HEIGHT} width={IMAGE_WIDTH} />
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
