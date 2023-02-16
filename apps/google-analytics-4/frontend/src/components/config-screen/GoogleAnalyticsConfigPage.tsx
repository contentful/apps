import { useState } from 'react';
import GoogleAnalyticsIcon from 'components/common/GoogleAnalyticsIcon';
import { styles } from 'components/config-screen/GoogleAnalytics.styles'
import Splitter from 'components/common/Splitter';
import ApiAccessPage from 'components/config-screen/api-access/ApiAccessPage';
import AboutSection from 'components/config-screen/header/AboutSection';
import { AccountSummariesType } from 'types';
import { Box } from '@contentful/f36-components';

const GoogleAnalyticsConfigPage = () => {
  // Adding this because this be resolved and used in INTEG-168
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [accountsSummaries, setAccountsSummaries] = useState<AccountSummariesType[]>([]);

  const handleAccountSummariesChange = (_accountSummaries: any[]) => {
    setAccountsSummaries(_accountSummaries)
  }

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <AboutSection />
        <Splitter />
        <ApiAccessPage
          onAccountSummariesChange={handleAccountSummariesChange}
        />
        <Splitter />
      </Box>

      <GoogleAnalyticsIcon />
    </>
  );
};

export default GoogleAnalyticsConfigPage;
