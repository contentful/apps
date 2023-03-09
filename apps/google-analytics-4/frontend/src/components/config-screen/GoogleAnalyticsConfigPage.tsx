import { useCallback, useEffect, useState } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppExtensionSDK } from '@contentful/app-sdk';
import GoogleAnalyticsIcon from 'components/common/GoogleAnalyticsIcon';
import { styles } from 'components/config-screen/GoogleAnalytics.styles';
import Splitter from 'components/common/Splitter';
import ApiAccessPage from 'components/config-screen/api-access/ApiAccessPage';
import AboutSection from 'components/config-screen/header/AboutSection';
import { AccountSummariesType } from 'types';
import { Box } from '@contentful/f36-components';
import AssignContentTypePage from 'components/config-screen/assign-content-type/AssignContentTypePage';

const GoogleAnalyticsConfigPage = () => {
  // Adding this because this be resolved and used in INTEG-168
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [accountsSummaries, setAccountsSummaries] = useState<AccountSummariesType[]>([]);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>();

  const handleAccountSummariesChange = (_accountSummaries: any[]) => {
    setAccountsSummaries(_accountSummaries);
  };

  const sdk = useSDK<AppExtensionSDK>();

  useEffect(() => {
    const getIsAppInstalled = async () => {
      const isInstalled = await sdk.app.isInstalled();

      setIsAppInstalled(isInstalled);

      sdk.app.setReady();
    };

    getIsAppInstalled();
  }, [sdk]);

  const onConfigurationCompleted = useCallback(() => {
    if (!isAppInstalled) {
      setIsAppInstalled(true);
    }
  }, [isAppInstalled]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted(() => onConfigurationCompleted());
  }, [sdk, onConfigurationCompleted]);

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <AboutSection />
        <Splitter />
        <ApiAccessPage onAccountSummariesChange={handleAccountSummariesChange} />
        {isAppInstalled && (
          <>
            <Splitter />
            <AssignContentTypePage />
          </>
        )}
      </Box>

      <GoogleAnalyticsIcon />
    </>
  );
};

export default GoogleAnalyticsConfigPage;
