import React from 'react';
import {
  Collapse,
  Flex,
  FormControl,
  Heading,
  Paragraph,
  Text,
  Textarea,
  TextLink,
} from '@contentful/f36-components';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@contentful/f36-icons';
import { css } from 'emotion';

import tokens from '@contentful/f36-tokens';
import InstalledServiceAccountKey from './InstalledServiceAccountKey';
import type { ServiceAccountKeyId } from '../types';
import QuickStartGuide from './QuickStartGuide';

interface FormControlServideAccountKeyFileProps {
  isValid: boolean;
  errorMessage: string;
  isRequired: boolean;
  isExpanded: boolean;
  currentServiceAccountKeyId: ServiceAccountKeyId | null;
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
  sectionHeading: css({
    fontSize: tokens.fontSizeL,
    marginBottom: tokens.spacing2Xs,
  })
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

    </FormControl>
  );

  return currentServiceAccountKeyId ? (
    <div className={className}>
      <Heading as="h2" className={styles.sectionHeading}>
        Authorization Credentials
      </Heading>
      <InstalledServiceAccountKey serviceAccountKeyId={currentServiceAccountKeyId} />
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
      <Collapse isExpanded={isExpanded}>
        <Paragraph marginTop="spacingS">
          <QuickStartGuide />
          {formControl}
        </Paragraph>
      </Collapse>
    </div>
  ) : (
    <>
      <QuickStartGuide />
      {formControl}
    </>
  );
};

export default FormControlServiceAccountKey;
