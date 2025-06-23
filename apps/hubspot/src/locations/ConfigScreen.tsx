import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Form,
  FormControl,
  TextInput,
  Paragraph,
  Collapse,
  IconButton,
  Subheading,
  TextLink,
  List,
} from '@contentful/f36-components';
import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK } from '@contentful/app-sdk';
import Splitter from '../components/Splitter';
import { styles } from './ConfigScreen.styles';
import {
  AppInstallationParameters,
  CONFIG_CONTENT_TYPE_ID,
  CONFIG_SCREEN_INSTRUCTIONS,
  ContentType,
  HUBSPOT_PRIVATE_APPS_URL,
} from '../utils';
import { ContentTypeProps, createClient, PlainClientAPI } from 'contentful-management';
import ContentTypeMultiSelect from '../components/ContentTypeMultiSelect';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHubspotTokenInvalid, setIsHubspotTokenInvalid] = useState(false);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    hubspotAccessToken: '',
  });
  const [selectedContentTypes, setSelectedContentTypes] = useState<ContentType[]>([]);
  const [availableContentTypes, setAvailableContentTypes] = useState<ContentType[]>([]);

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

  function checkIfHasValue(value: string, setIsInvalid: (valid: boolean) => void) {
    const hasValue = !!value?.trim();
    setIsInvalid(!hasValue);
    return hasValue;
  }

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const hubspotTokenHasValue = checkIfHasValue(
      parameters.hubspotAccessToken,
      setIsHubspotTokenInvalid
    );

    if (!hubspotTokenHasValue) {
      sdk.notifier.error('Some fields are missing or invalid');
      return false;
    }

    await addAppToSidebar(
      sdk,
      cma,
      selectedContentTypes.map((contentType) => contentType.id)
    );

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
      targetState: { EditorInterface: { ...currentState?.EditorInterface, ...editorInterface } },
    };
  }, [parameters, sdk, cma, selectedContentTypes]);

  const fetchAllContentTypes = async (): Promise<ContentTypeProps[]> => {
    let allContentTypes: ContentTypeProps[] = [];
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
        allContentTypes = allContentTypes.concat(response.items as ContentTypeProps[]);
        areMoreContentTypes = response.items.length === limit;
      } else {
        areMoreContentTypes = false;
      }
      skip += limit;
    }

    return allContentTypes;
  };

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

  useEffect(() => {
    (async () => {
      const currentState = await sdk.app.getCurrentState();
      const currentContentTypesIds = Object.keys(currentState?.EditorInterface || {});
      const excludedContentTypesIds = [CONFIG_CONTENT_TYPE_ID];

      const allContentTypes = await fetchAllContentTypes();

      const newAvailableContentTypes = allContentTypes
        .filter((ct) => !excludedContentTypesIds.includes(ct.sys.id))
        .map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setAvailableContentTypes(newAvailableContentTypes);

      // If we have current content types, set them as selected
      if (currentContentTypesIds.length > 0) {
        const currentContentTypes = allContentTypes
          .filter((ct) => currentContentTypesIds.includes(ct.sys.id))
          .map((ct) => ({ id: ct.sys.id, name: ct.name }));
        setSelectedContentTypes(currentContentTypes);
      }
    })();
  }, []);

  return (
    <Flex justifyContent="center" alignItems="center">
      <Box className={styles.body}>
        <Heading marginBottom="spacingS">Set up Hubspot</Heading>
        <Paragraph>
          Seamlessly sync Contentful entry content to email campaigns in Hubspot. Map entry fields
          to custom email modules in Hubspot to continuously and automatically keep content
          consistent at scale.
        </Paragraph>
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
            {isHubspotTokenInvalid && (
              <FormControl.ValidationMessage marginBottom="spacingS">
                Invalid API key
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
        <ContentTypeMultiSelect
          selectedContentTypes={selectedContentTypes}
          setSelectedContentTypes={setSelectedContentTypes}
          availableContentTypes={availableContentTypes}
        />
      </Box>
    </Flex>
  );
};

async function addAppToSidebar(sdk: ConfigAppSDK, cma: PlainClientAPI, contentTypesId: string[]) {
  for (const contentTypeId of contentTypesId) {
    try {
      const editorInterface = await cma.editorInterface.get({ contentTypeId });
      const updatedSidebar = [
        ...(editorInterface.sidebar || []),
        {
          widgetId: sdk.ids.app,
          widgetNamespace: 'app',
          settings: { position: 0 },
        },
      ];

      await cma.editorInterface.update(
        { contentTypeId },
        {
          ...editorInterface,
          sidebar: updatedSidebar,
        }
      );
    } catch (e) {
      sdk.notifier.error(`Failed to add app to sidebar for content type ${contentTypeId}`);
    }
  }
}

export default ConfigScreen;
