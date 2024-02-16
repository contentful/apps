import { useCallback, useEffect, useReducer, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import AccessSection from '@components/config/AccessSection/AccessSection';
import NotificationsSection from '@components/config/NotificationsSection/NotificationsSection';
import parameterReducer from '@components/config/parameterReducer';
import { initialParameters } from '@constants/defaultParams';
import useInitializeParameters from '@hooks/useInitializeParameters';
import { useMsal } from '@azure/msal-react';
import { styles } from './ConfigPage.styles';
import { headerSection } from '@constants/configCopy';
import { Box, Heading, Paragraph } from '@contentful/f36-components';

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [notificationIndexToEdit, setNotificationIndexToEdit] = useState<number | null>(null);

  const sdk = useSDK<ConfigAppSDK>();
  // A hook that returns the PublicClientApplication instance from MSAL to see if there is an authenticated account
  const { accounts } = useMsal();

  useInitializeParameters(dispatchParameters);

  const getIsAppInstalled = useCallback(async () => {
    const isInstalled = await sdk.app.isInstalled();

    setIsAppInstalled(isInstalled);
  }, [sdk]);

  useEffect(() => {
    getIsAppInstalled();
    sdk.app.onConfigurationCompleted(() => setIsAppInstalled(true));
  }, [sdk]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if (!parameters.tenantId) {
      sdk.notifier.error('A valid Tenant Id is required');
      return false;
    }

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  return (
    <>
      <Box className={styles.box}>
        <Heading>{headerSection.title}</Heading>
        <Paragraph>{headerSection.description}</Paragraph>
        <hr className={styles.splitter} />
        <AccessSection
          dispatch={dispatchParameters}
          parameters={parameters}
          isAppInstalled={isAppInstalled}
        />
      </Box>
      {isAppInstalled && accounts.length ? (
        <NotificationsSection
          notifications={parameters.notifications}
          dispatch={dispatchParameters}
          notificationIndexToEdit={notificationIndexToEdit}
          setNotificationIndexToEdit={setNotificationIndexToEdit}
        />
      ) : null}
    </>
  );
};

export default ConfigPage;
