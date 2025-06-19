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
  CONFIG_SCREEN_INSTRUCTIONS,
  HUBSPOT_PRIVATE_APPS_URL,
} from '../utils';

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHubspotTokenInvalid, setIsHubspotTokenInvalid] = useState(false);
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    hubspotAccessToken: '',
  });

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

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

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
        <Splitter marginTop="spacing2Xs" marginBottom="none" />
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
