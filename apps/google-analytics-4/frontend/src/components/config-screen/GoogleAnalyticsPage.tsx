import { useState } from 'react';
import GoogleAnalyticsIcon from 'components/common/GoogleAnalyticsIcon';
import { styles } from 'components/config-screen/GoogleAnalytics.styles'
import Splitter from 'components/common/Splitter';
import ApiAccessPage from 'components/config-screen/api-access/ApiAccessPage';
import ConfigurationPage from 'components/config-screen/configure-account-property/ConfigurationPage';
import AboutSection from 'components/config-screen/header/AboutSection';
import { BadgeVariant, Box } from '@contentful/f36-components';
import { AccountSummariesType } from 'types';

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
  const [accountsSummaries, setAccountsSummaries] = useState<AccountSummariesType[]>([]);

  const handleAccountSummariesFetch = (_accountSummaries: any[]) => {
    setAccountsSummaries(_accountSummaries)
  }

  return (
    <>
      <Box className={styles.background} />

      <Box className={styles.body}>
        <AboutSection />
        <Splitter />
        <ApiAccessPage
          onAccountSummariesFetch={handleAccountSummariesFetch}
        />
        <Splitter />
        {accountsSummaries.length > 0 && (
          <ConfigurationPage
            accountsSummaries={accountsSummaries}
          />
        )}
        <Splitter />
      </Box>

      <GoogleAnalyticsIcon />
    </>
  );
};

export default HomeAnalyticsPage;
