import { useState } from 'react';
import GoogleAnalyticsIcon from 'components/common/GoogleAnalyticsIcon';
import { styles } from 'components/config-screen/GoogleAnalytics.styles'
import Splitter from 'components/common/Splitter';
import ApiAccessPage from 'components/config-screen/api-access/ApiAccessPage';
import ConfigurationPage from 'components/config-screen/configuration/ConfigurationPage';
import AboutSection from 'components/config-screen/header/AboutSection';
import useKeyService from 'components/../hooks/useKeyService';
import { BadgeVariant, Box } from '@contentful/f36-components';

export interface InstallationErrorType {
  type: INSTALLATION_ERROR_ENUMS,
  badgeText: string,
  badgeVariant: BadgeVariant,
  description: string,
  resourceLink?: string,
  documentationLink?: string
}

export enum INSTALLATION_ERROR_ENUMS { unknown, adminApi, dataApi, noAccounts, noProperties }

const HomeAnalyticsPage = () => {
  const [isInEditMode, setIsInEditMode] = useState<boolean>(false);
  const [accountsSummaries, setAccountsSummaries] = useState<any[]>([]);
  const [installationErrors, setInstallationErrors] = useState<InstallationErrorType[]>([])

  const handleInstallationErrors = (_installationErrors: InstallationErrorType[]) => {
    setInstallationErrors(_installationErrors)
  }

  const handleAccountSummariesFetch = (_accountSummaries: any[]) => {
    setAccountsSummaries(_accountSummaries)
  }

  const handleEditGoogleAccountDetails = () => {
    setIsInEditMode(true);
  }

  const handleCancelGoogleAccountDetails = () => {
    handleKeyFileChange('');
    setIsInEditMode(false);
  }
  const { parameters, serviceAccountKeyFile, serviceAccountKeyFileErrorMessage, serviceAccountKeyFileIsValid, serviceAccountKeyFileIsRequired, handleKeyFileChange } = useKeyService({ onCancelGoogleAccountDetails: handleEditGoogleAccountDetails });

  const handleKeyFileChangeEventWrapper = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleKeyFileChange(event.target.value);
  };

  return (
    <>
      <Box className={styles.background} />

      <Box className={styles.body}>
        <AboutSection />
        <Splitter />
        <ApiAccessPage
          isValid={serviceAccountKeyFileIsValid}
          isRequired={serviceAccountKeyFileIsRequired}
          errorMessage={serviceAccountKeyFileErrorMessage}
          currentServiceAccountKeyId={parameters.serviceAccountKeyId}
          currentServiceAccountKey={parameters.serviceAccountKey}
          serviceAccountKeyFile={serviceAccountKeyFile}
          onKeyFileChange={handleKeyFileChangeEventWrapper}
          isInEditMode={isInEditMode}
          onEditGoogleAccountDetails={handleEditGoogleAccountDetails}
          onCancelGoogleAccountDetails={handleCancelGoogleAccountDetails}
          onAccountSummariesFetch={handleAccountSummariesFetch}
          installationErrors={installationErrors}
          onInstallationErrors={handleInstallationErrors}
        />
        <Splitter />
        {accountsSummaries.length > 0 && installationErrors.length === 0 && (
          <>
            <ConfigurationPage accountsSummaries={accountsSummaries} isInEditMode={isInEditMode}/>
            <Splitter />
          </>
        )}
      </Box>

      <GoogleAnalyticsIcon />
    </>
  );
};

export default HomeAnalyticsPage;
