import { useCallback, useEffect, useReducer, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import AccessSection from '@components/config/AccessSection/AccessSection';
import NotificationsSection from '@components/config/NotificationsSection/NotificationsSection';
import parameterReducer from '@components/config/parameterReducer';
import { initialParameters } from '@constants/defaultParams';
import useInitializeParameters from '@hooks/useInitializeParameters';
import { styles } from './ConfigPage.styles';
import { headerSection, notificationsSection } from '@constants/configCopy';
import { Box, Heading, Paragraph } from '@contentful/f36-components';

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [notificationIndexToEdit, setNotificationIndexToEdit] = useState<number | null>(null);

  const sdk = useSDK<ConfigAppSDK>();

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
    // pending changes defined as an notifications that have been opened but not saved via <NotificationEditModeFooter/>
    const pendingChanges = notificationIndexToEdit !== null;

    if (pendingChanges) {
      sdk.notifier.error(notificationsSection.pendingChangesWarning);
      return false;
    }

    // prevent save on initial installation if there isn't a tenant id
    if (!parameters.tenantId && !isAppInstalled) {
      sdk.notifier.error('A valid Tenant Id is required');
      return false;
    }

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk, notificationIndexToEdit]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  return (
    <>
      <Box className={styles.box}>
        <Heading>{headerSection.title}</Heading>
        <Paragraph>{headerSection.description}</Paragraph>
        <hr className={styles.splitter} />
        <AccessSection dispatch={dispatchParameters} parameters={parameters} />
      </Box>
      {isAppInstalled && parameters.tenantId ? (
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
