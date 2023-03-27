import React, { useState } from 'react';
import {
  Stack,
  Card,
  Paragraph,
  FormControl,
  Textarea,
  Flex,
  Note,
  TextLink,
  Text,
  Box,
} from '@contentful/f36-components';
import { CheckCircleIcon, ExternalLinkTrimmedIcon } from '@contentful/f36-icons';
import { ServiceAccountKeyId } from 'types';
import {
  AssertionError,
  convertKeyFileToServiceAccountKey,
  convertServiceAccountKeyToServiceAccountKeyId,
} from 'utils/serviceAccountKey';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';

interface Props {
  isInEditMode: boolean;
  mergeSdkParameters: Function;
  parameters: KeyValueMap;
  onInEditModeChange: Function;
  onKeyFileUpdate: Function;
}

const placeholderText = `{
  "type": "service_account",
  ...
}`;

export default function SetupServiceAccountCard(props: Props) {
  const { mergeSdkParameters, isInEditMode, onInEditModeChange, onKeyFileUpdate } = props;

  const [rawServiceAccountKey, setRawServiceAccountKey] = useState<string>();
  const [serviceAccountKeyId, setServiceAccountKeyId] = useState<ServiceAccountKeyId>();
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRawServiceAccountKeyChange = (e: any) => {
    const keyfile = e.target.value;
    setRawServiceAccountKey(keyfile);
    handleKeyFileToServiceAccount(keyfile);
  };

  const handleKeyFileToServiceAccount = (keyfile: string) => {
    try {
      const _serviceAccountKey = convertKeyFileToServiceAccountKey(keyfile);
      const _serviceAccountKeyId =
        convertServiceAccountKeyToServiceAccountKeyId(_serviceAccountKey);

      onKeyFileUpdate(_serviceAccountKey);
      setServiceAccountKeyId(_serviceAccountKeyId);
      setErrorMessage('');

      const _parameters = {
        serviceAccountKeyId: _serviceAccountKeyId,
      };

      mergeSdkParameters(_parameters);
    } catch (e: any) {
      onKeyFileUpdate(undefined);
      // failed assertions about key file contents or could not parse as JSON
      if (e instanceof AssertionError || e instanceof SyntaxError) {
        setErrorMessage(e.message);
      } else {
        console.error(e);
        setErrorMessage('An unknown error occurred');
      }
    }
  };

  const handleCancelClick = () => {
    setRawServiceAccountKey('');
    setServiceAccountKeyId(undefined);
    setErrorMessage('');
    onInEditModeChange(false);
  };

  return (
    <Stack spacing="spacingL" flexDirection="column">
      <Card>
        <Flex alignItems="center" marginBottom="spacingM" justifyContent="space-between">
          <Paragraph marginBottom="none">
            <b>Google Service Account Details</b>
          </Paragraph>
          {isInEditMode && (
            <TextLink
              testId="cancelServiceAccountButton"
              as="button"
              variant="primary"
              onClick={handleCancelClick}>
              Cancel
            </TextLink>
          )}
        </Flex>
        <Box marginBottom="spacingM">
          <Note variant="primary">
            Follow{' '}
            <TextLink
              icon={<ExternalLinkTrimmedIcon />}
              alignIcon="end"
              href="https://www.contentful.com/help/google-analytics-service-account-setup/"
              target="_blank"
              rel="noopener noreferrer">
              these detailed instructions
            </TextLink>{' '}
            to create a service account in Google and obtain the required service account key file.
            When you are finished, copy and paste the entire contents of this file into the "Service
            Account Key File" field above.
          </Note>
        </Box>
        <FormControl
          id="accountCredentialsFile"
          isInvalid={rawServiceAccountKey !== undefined && !serviceAccountKeyId}
          isRequired={true}
          marginBottom={!isInEditMode ? 'none' : 'spacingM'}>
          <FormControl.Label>Service Account Key</FormControl.Label>
          <Textarea
            spellCheck={false}
            name="accountCredentialsFile"
            placeholder={placeholderText}
            rows={10}
            value={rawServiceAccountKey}
            onChange={handleRawServiceAccountKeyChange}
          />
          {!rawServiceAccountKey ? (
            <FormControl.HelpText>
              Paste the service account key file (JSON) above
            </FormControl.HelpText>
          ) : errorMessage ? (
            <FormControl.ValidationMessage>Error: {errorMessage}</FormControl.ValidationMessage>
          ) : (
            <Flex marginTop="spacingXs" alignItems="center">
              <Flex isInline={true} alignItems="center">
                <CheckCircleIcon variant="positive" />
                <Text as="p" marginLeft="spacing2Xs" fontColor="gray700">
                  Service account key file is valid
                </Text>
              </Flex>
            </Flex>
          )}
        </FormControl>
      </Card>
      <Paragraph marginBottom="none">
        To use the Google Analytics app, you will need to provision a{' '}
        <TextLink
          icon={<ExternalLinkTrimmedIcon />}
          alignIcon="end"
          href="https://www.contentful.com/help/google-analytics-service-account-setup/"
          target="_blank"
          rel="noopener noreferrer">
          Google Cloud service account
        </TextLink>{' '}
        for which you enable <i>read access</i> to your organization's Google Analytics data.
      </Paragraph>
      <Paragraph marginBottom="none">
        After configuring the service account, you'll download a set of credentials that Contentful
        will use to access Google Analytics 4 data on this service account's behalf.
      </Paragraph>
    </Stack>
  );
}
