import React from 'react';
import InstalledServiceAccountCard from './service-account/InstalledServiceAccountCard';
import SetupServiceAccountCard from './service-account/SetupServiceAccountCard';
import { Subheading, Paragraph, Stack } from '@contentful/f36-components';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';

interface Props {
  isValid: boolean;
  errorMessage: string;
  isRequired: boolean;
  currentServiceAccountKeyId: ServiceAccountKeyId | null;
  currentServiceAccountKey: ServiceAccountKey | null;
  serviceAccountKeyFile: string;
  onKeyFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isInEditMode: boolean;
  onEditGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>;
  onCancelGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>;
}

const ApiAccessPage = (props: Props) => {
  const {
    isRequired,
    isValid,
    errorMessage,
    currentServiceAccountKeyId,
    currentServiceAccountKey,
    serviceAccountKeyFile,
    onKeyFileChange,
    isInEditMode,
    onEditGoogleAccountDetails,
    onCancelGoogleAccountDetails,
  } = props;

  return (
    <Stack spacing="spacingL" flexDirection="column" alignItems="flex-start">
      <Subheading marginBottom="none">API Access</Subheading>
      <Paragraph marginBottom="none">
        Authorize this application to access page analytics data from your organization’s Google
        Analytics account
      </Paragraph>
      {!isInEditMode && currentServiceAccountKeyId && currentServiceAccountKey ? (
        <InstalledServiceAccountCard
          onEditGoogleAccountDetails={onEditGoogleAccountDetails}
          serviceAccountKeyId={currentServiceAccountKeyId}
          serviceAccountKey={currentServiceAccountKey}
        />
      ) : (
        <SetupServiceAccountCard
          isRequired={isRequired}
          isValid={isValid}
          errorMessage={errorMessage}
          serviceAccountKeyFile={serviceAccountKeyFile}
          onKeyFileChange={onKeyFileChange}
          isInEditMode={isInEditMode}
          onCancelGoogleAccountDetails={onCancelGoogleAccountDetails}
        />
      )}
    </Stack>
  );
};

export default ApiAccessPage;
