import React from 'react';
import {
  Collapse,
  Flex,
  FormControl,
  Note,
  Paragraph,
  Text,
  Textarea,
  TextLink,
} from '@contentful/f36-components';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkTrimmedIcon,
} from '@contentful/f36-icons';
import { css } from 'emotion';

import tokens from '@contentful/f36-tokens';
import InstalledServiceAccountKey from '../InstalledServiceAccountKey/InstalledServiceAccountKey';
import type { ServiceAccountKey, ServiceAccountKeyId } from '../../types';

interface FormControlServideAccountKeyFileProps {
  isValid: boolean;
  errorMessage: string;
  isRequired: boolean;
  isExpanded: boolean;
  currentServiceAccountKeyId: ServiceAccountKeyId | null;
  currentServiceAccountKey: ServiceAccountKey | null;
  serviceAccountKeyFile: string;
  onKeyFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExpanderClick: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
}

const styles = {
  credentialsInput: css({
    fontFamily: 'monospace',
  }),
  credentialsNote: css({
    marginBottom: tokens.spacingM,
  }),
  credentialsExplanation: css({
    marginTop: tokens.spacingL,
  }),
};

const placeholderText = `{
  "type": "service_account",
  ...
}`;

const FormControlServiceAccountKey = ({
  isRequired,
  isValid,
  isExpanded,
  errorMessage,
  currentServiceAccountKeyId,
  currentServiceAccountKey,
  serviceAccountKeyFile,
  onKeyFileChange,
  onExpanderClick,
  className,
}: FormControlServideAccountKeyFileProps) => {
  const formControl = (
    <FormControl
      marginTop="spacingL"
      id="accountCredentialsFile"
      isInvalid={!isValid}
      isRequired={isRequired}
    >
      <FormControl.Label>Google Service Account Key File</FormControl.Label>
      <Textarea
        name="accountCredentialsFile"
        placeholder={placeholderText}
        rows={10}
        className={styles.credentialsInput}
        value={serviceAccountKeyFile}
        onChange={onKeyFileChange}
      />
      {isValid ? (
        serviceAccountKeyFile ? (
          <Flex marginTop="spacingXs" alignItems="center">
            <Flex isInline={true} alignItems="center">
              <CheckCircleIcon variant="positive" />{' '}
              <Text as="p" marginLeft="spacing2Xs" fontColor="gray700">
                Service account key file is valid
              </Text>
            </Flex>
          </Flex>
        ) : (
          <FormControl.HelpText>
            Paste the contents of your service account key file above
          </FormControl.HelpText>
        )
      ) : (
        <FormControl.ValidationMessage>Error: {errorMessage}</FormControl.ValidationMessage>
      )}
      <div className={styles.credentialsExplanation}>
        <Note variant="primary" className={styles.credentialsNote}>
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
        <Paragraph>
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
        <Paragraph>
          After configuring the service account, you'll download a set of credentials that
          Contentful will use to access Google Analytics data on this service account's behalf.
        </Paragraph>
      </div>
    </FormControl>
  );

  return currentServiceAccountKeyId && currentServiceAccountKey ? (
    <div className={className}>
      <InstalledServiceAccountKey
        serviceAccountKeyId={currentServiceAccountKeyId}
        serviceAccountKey={currentServiceAccountKey}
      />
      <TextLink
        as="button"
        variant="primary"
        icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        alignIcon="start"
        onClick={onExpanderClick}
        testId="keyFileFieldExpander"
      >
        Replace with new Service Account Key
      </TextLink>
      <Collapse isExpanded={isExpanded}>{formControl}</Collapse>
    </div>
  ) : (
    formControl
  );
};

export default FormControlServiceAccountKey;
