import React, { useCallback, useEffect, useState } from 'react';
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
import InstalledServiceAccountKey from './InstalledServiceAccountKey';
import {
  convertServiceAccountKeyToServiceAccountKeyId,
  convertKeyFileToServiceAccountKey,
  AssertionError,
} from '../utils/serviceAccountKey';
import type { ServiceAccountKey, ServiceAccountKeyId } from '../types';

interface FormControlState {
  isInvalid: boolean;
  errorMessage: string;
}

interface FormControlServideAccountKeyFileProps {
  setServiceAccountKey: (serviceAccountKey: ServiceAccountKey | null) => void;
  setServiceAccountKeyId: (serviceAccountKey: ServiceAccountKeyId | null) => void;
  setIsInvalid: (isInvalid: boolean) => void;
  isRequired: boolean;
  currentServiceAccountKeyId: ServiceAccountKeyId | null;
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
  setServiceAccountKey,
  setServiceAccountKeyId,
  setIsInvalid,
  isRequired,
  currentServiceAccountKeyId,
  className,
}: FormControlServideAccountKeyFileProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [serviceAccountKeyFile, setServiceAccountKeyFile] = useState<string>('');
  const [formControlState, setFormControlState] = useState<FormControlState>({
    isInvalid: false,
    errorMessage: '',
  });

  const setValidServiceAccountKey = useCallback(
    (newServiceAccountKey: ServiceAccountKey | null) => {
      setServiceAccountKey(newServiceAccountKey);
      setServiceAccountKeyId(
        newServiceAccountKey
          ? convertServiceAccountKeyToServiceAccountKeyId(newServiceAccountKey)
          : null
      );
      setFormControlState({
        isInvalid: false,
        errorMessage: '',
      });
    },
    [setFormControlState, setServiceAccountKey, setServiceAccountKeyId]
  );

  const setInvalidServiceAccountKey = useCallback(
    (errorMessage: string) => {
      setServiceAccountKey(null);
      setServiceAccountKeyId(null);
      setFormControlState({
        isInvalid: true,
        errorMessage,
      });
    },
    [setFormControlState, setServiceAccountKey, setServiceAccountKeyId]
  );

  useEffect(() => {
    setIsInvalid(formControlState.isInvalid);
  }, [formControlState.isInvalid, setIsInvalid]);

  useEffect(() => {
    if (currentServiceAccountKeyId) {
      setServiceAccountKeyFile('');
      setIsExpanded(false);
    }
  }, [currentServiceAccountKeyId]);

  useEffect(() => {
    const trimmedFieldValue = serviceAccountKeyFile.trim();

    if (trimmedFieldValue === '') {
      setValidServiceAccountKey(null);
      return;
    }

    let newServiceAccountKey: ServiceAccountKey;
    try {
      newServiceAccountKey = convertKeyFileToServiceAccountKey(trimmedFieldValue);
    } catch (e) {
      if (
        // failed assertions about key file contents
        e instanceof AssertionError ||
        // could not parse as JSON
        e instanceof SyntaxError
      ) {
        setInvalidServiceAccountKey(e.message);
      } else {
        console.error(e);
        setInvalidServiceAccountKey('An unknown error occurred');
      }
      return;
    }

    setValidServiceAccountKey(newServiceAccountKey);
  }, [serviceAccountKeyFile, setValidServiceAccountKey, setInvalidServiceAccountKey]);

  const onKeyFileTextareaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setServiceAccountKeyFile(event.target.value);
  };

  const formControl = (
    <FormControl
      marginTop="spacingL"
      id="accountCredentialsFile"
      isInvalid={formControlState.isInvalid}
      isRequired={isRequired}
    >
      <FormControl.Label isRequired={isRequired}>Google Service Account Key File</FormControl.Label>
      <Textarea
        name="accountCredentialsFile"
        placeholder={placeholderText}
        rows={10}
        className={styles.credentialsInput}
        value={serviceAccountKeyFile}
        onChange={onKeyFileTextareaChange}
      />
      {formControlState.isInvalid ? (
        <FormControl.ValidationMessage>
          Error: {formControlState.errorMessage}
        </FormControl.ValidationMessage>
      ) : serviceAccountKeyFile ? (
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
      )}

      <div className={styles.credentialsExplanation}>
        <Note variant="primary" className={styles.credentialsNote}>
          Follow{' '}
          <TextLink
            icon={<ExternalLinkTrimmedIcon />}
            alignIcon="end"
            href="https://cloud.google.com/iam/docs/understanding-service-accounts"
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
            href="https://cloud.google.com/iam/docs/understanding-service-accounts"
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

  return currentServiceAccountKeyId ? (
    <div className={className}>
      <InstalledServiceAccountKey serviceAccountKeyId={currentServiceAccountKeyId} />
      <TextLink
        as="button"
        variant="primary"
        icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        alignIcon="start"
        onClick={() => setIsExpanded(!isExpanded)}
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
