import React, { useEffect, useState } from 'react';
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
import { debounce, isEqual } from 'lodash';
import { KeyValueMap } from '@contentful/app-sdk/dist/types/entities';

interface Props {
  isInEditMode: boolean;
  mergeSdkParameters: Function;
  parameters: KeyValueMap;
  onIsValidServiceAccount: Function;
  onInEditModeChange: Function;
  onKeyFileUpdate: Function;
}

const placeholderText = `{
  "type": "service_account",
  ...
}`;

export default function SetupServiceAccountCard(props: Props) {
  const {
    mergeSdkParameters,
    parameters,
    isInEditMode,
    onInEditModeChange,
    onIsValidServiceAccount,
    onKeyFileUpdate,
  } = props;

  const [keyFile, setKeyFile] = useState<string>();
  const [serviceAccountKeyId, setServiceAccountKeyId] = useState<ServiceAccountKeyId>();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    !errorMessage && parameters.serviceAccountKeyId
      ? onIsValidServiceAccount(true)
      : onIsValidServiceAccount(false);

    // This is a on page load check, not whenever parameters service accounts change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onIsValidServiceAccount]);

  useEffect(() => {
    if (!errorMessage && parameters.serviceAccountKeyId && keyFile) {
      onKeyFileUpdate(JSON.parse(keyFile));
    }
  }, [errorMessage, keyFile, onKeyFileUpdate, parameters.serviceAccountKeyId]);

  const handleKeyFileChange = (e: any) => {
    setKeyFile(e.target.value);
    const debHandleServiceKey = debounce(() => handleKeyFileToServiceAccount(e.target.value), 150);
    debHandleServiceKey();
  };

  const handleKeyFileToServiceAccount = (keyfile: string) => {
    try {
      const _serviceAccountKey = convertKeyFileToServiceAccountKey(keyfile);
      const _serviceAccountKeyId =
        convertServiceAccountKeyToServiceAccountKeyId(_serviceAccountKey);
      setServiceAccountKeyId(_serviceAccountKeyId);
      setErrorMessage('');

      const _parameters = {
        serviceAccountKeyId: _serviceAccountKeyId,
      };

      mergeSdkParameters(_parameters);
      onIsValidServiceAccount(true);
    } catch (e: any) {
      onIsValidServiceAccount(false);
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
    setKeyFile('');
    setServiceAccountKeyId(undefined);
    setErrorMessage('');
    onInEditModeChange(false);
    onIsValidServiceAccount(true);
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
          isInvalid={!keyFile || !serviceAccountKeyId}
          isRequired={true}
          marginBottom={!isInEditMode ? 'none' : 'spacingM'}>
          <FormControl.Label>Private Key File</FormControl.Label>
          <Textarea
            name="accountCredentialsFile"
            placeholder={placeholderText}
            rows={10}
            value={keyFile}
            onChange={handleKeyFileChange}
          />
          {!keyFile ? (
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
        will use to access Google Analytics data on this service account's behalf.
      </Paragraph>
    </Stack>
  );
}
