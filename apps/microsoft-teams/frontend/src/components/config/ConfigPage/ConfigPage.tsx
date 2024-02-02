import { useCallback, useEffect, useReducer, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import AccessSection from '@components/config/AccessSection/AccessSection';
import NotificationsSection from '@components/config/NotificationsSection/NotificationsSection';
import parameterReducer from '@components/config/parameterReducer';
import { initialParameters } from '@constants/defaultParams';
import useInitializeParameters from '@hooks/useInitializeParameters';

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

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

  console.log({ parameters });

  return (
    <>
      <AccessSection
        tenantId={parameters.tenantId}
        dispatch={dispatchParameters}
        parameters={parameters}
        handler={onConfigure}
      />
      {isAppInstalled && (
        <NotificationsSection
          notifications={parameters.notifications}
          dispatch={dispatchParameters}
        />
      )}
    </>
  );
};

export default ConfigPage;
