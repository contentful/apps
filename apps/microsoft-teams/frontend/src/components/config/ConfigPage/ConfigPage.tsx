import { useCallback, useEffect, useReducer } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import AccessSection from '@components/config/AccessSection/AccessSection';
import NotificationsSection from '@components/config/NotificationsSection/NotificationsSection';
import parameterReducer from '@components/config/parameterReducer';
import { initialParameters } from '@constants/defaultParams';
import useInitializeParameters from '@hooks/useInitializeParameters';

const ConfigPage = () => {
  const [parameters, dispatchParameters] = useReducer(parameterReducer, initialParameters);

  const sdk = useSDK<ConfigAppSDK>();

  useInitializeParameters(dispatchParameters);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

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
      <AccessSection tenantId={parameters.tenantId} dispatch={dispatchParameters} />
      <NotificationsSection
        notifications={parameters.notifications}
        dispatch={dispatchParameters}
      />
    </>
  );
};

export default ConfigPage;
