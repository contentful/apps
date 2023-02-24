import React from 'react'
import { Stack, Card, Paragraph, FormControl, Textarea, Flex, Note, TextLink, Text, Box } from '@contentful/f36-components';
import {
  CheckCircleIcon,
  ExternalLinkTrimmedIcon,
} from '@contentful/f36-icons';

interface Props {
  isValid: boolean;
  errorMessage: string;
  isRequired: boolean;
  serviceAccountKeyFile: string;
  onKeyFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isInEditMode: boolean;
  onCancelGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>
}

const placeholderText = `{
  "type": "service_account",
  ...
}`;

export default function SetupServiceAccountCard(props: Props) {
  const {
    isValid,
    errorMessage,
    isRequired,
    serviceAccountKeyFile,
    onKeyFileChange,
    isInEditMode,
    onCancelGoogleAccountDetails
  } = props;

  return (
    <Stack spacing='spacingL' flexDirection='column'>
      <Card>
        <Flex justifyContent="space-between" marginBottom='spacingL'>
          <Paragraph marginBottom='none'><b >Google Service Account Details</b></Paragraph>
          {isInEditMode && <TextLink testId='editServiceAccountButton' as="button" variant='primary' onClick={onCancelGoogleAccountDetails}>Cancel</TextLink>}
        </Flex>
        <Box marginBottom='spacingM'>
          <Note variant="primary">
            Follow{' '}
            <TextLink
              icon={<ExternalLinkTrimmedIcon />}
              alignIcon="end"
              href="https://www.contentful.com/help/google-analytics-service-account-setup/"
              target="_blank"
              rel="noopener noreferrer"
            >
              these detailed instructions
            </TextLink>{' '}
            to create a service account in Google and obtain the required service account key file.
            When you are finished, copy and paste the entire contents of this file into the "Service
            Account Key File" field above.
          </Note>
        </Box>
        <FormControl
          id="accountCredentialsFile"
          isInvalid={!isValid}
          isRequired={isRequired}
          marginBottom={!isInEditMode ? 'none' : 'spacingM'}
        >
          <FormControl.Label>Private Key File</FormControl.Label>
          <Textarea
            name="accountCredentialsFile"
            placeholder={placeholderText}
            rows={10}
            value={serviceAccountKeyFile}
            onChange={onKeyFileChange}
          />
          {isValid ? (
            serviceAccountKeyFile ? (
              <Flex marginTop="spacingXs" alignItems="center">
                <Flex isInline={true} alignItems="center">
                  <CheckCircleIcon variant="positive" />
                  <Text as="p" marginLeft="spacing2Xs" fontColor="gray700">
                    Service account key file is valid
                  </Text>
                </Flex>
              </Flex>
            ) : (
              <FormControl.HelpText>
                Paste the service account key file (JSON) above
              </FormControl.HelpText>
            )
          ) : (
            <FormControl.ValidationMessage>Error: {errorMessage}</FormControl.ValidationMessage>
          )}
        </FormControl>
      </Card>
      <Paragraph marginBottom='none'>
        To use the Google Analytics app, you will need to provision a{' '}
        <TextLink
          icon={<ExternalLinkTrimmedIcon />}
          alignIcon="end"
          href="https://www.contentful.com/help/google-analytics-service-account-setup/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Cloud service account
        </TextLink>{' '}
        for which you enable <i>read access</i> to your organization's Google Analytics data.
      </Paragraph>
      <Paragraph marginBottom='none'>
        After configuring the service account, you'll download a set of credentials that
        Contentful will use to access Google Analytics data on this service account's behalf.
      </Paragraph>
    </Stack>
  );
}
