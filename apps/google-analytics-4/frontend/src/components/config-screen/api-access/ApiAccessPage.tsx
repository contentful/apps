import React, { useState } from 'react';
import InstalledServiceAccountCard from 'components/config-screen/api-access/installed/InstalledServiceAccountCard';
import SetupServiceAccountCard from 'components/config-screen/api-access/setup/SetupServiceAccountCard';
import { Subheading, Paragraph, Stack } from '@contentful/f36-components';
import { ServiceAccountKeyId, ServiceAccountKey } from 'types';
import { InstallationErrorType } from 'components/config-screen/GoogleAnalyticsPage';

interface Props {
  isValid: boolean;
  errorMessage: string;
  isRequired: boolean;
  currentServiceAccountKeyId: ServiceAccountKeyId | null;
  currentServiceAccountKey: ServiceAccountKey | null;
  serviceAccountKeyFile: string;
  onKeyFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isInEditMode: boolean;
  onEditGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>
  onCancelGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>
  onSaveGoogleAccountDetails: React.MouseEventHandler<HTMLButtonElement>
  onAccountSummariesFetch: Function;
  installationErrors: InstallationErrorType[];
  onInstallationErrors: Function;
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
    onSaveGoogleAccountDetails,
    onAccountSummariesFetch,
    onInstallationErrors,
    installationErrors,
  } = props

  return (
    <Stack spacing='spacingL' flexDirection='column' alignItems='flex-start' >
      <Subheading marginBottom='none'>
        API Access
      </Subheading>
      <Paragraph marginBottom='none'>
        Authorize this application to access page analytics data from your organization’s Google
        Analytics account
      </Paragraph>
      {
        !isInEditMode && currentServiceAccountKeyId && currentServiceAccountKey ? (
          <InstalledServiceAccountCard
            onEditGoogleAccountDetails={onEditGoogleAccountDetails}
            serviceAccountKeyId={currentServiceAccountKeyId}
            serviceAccountKey={currentServiceAccountKey}
            onAccountSummariesFetch={onAccountSummariesFetch}
            installationErrors={installationErrors}
            onInstallationErrors={onInstallationErrors}
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
            onSaveGoogleAccountDetails={onSaveGoogleAccountDetails}
          />
        )
      }
    </Stack>
  )
};

export default ApiAccessPage;
