import { Dispatch, useEffect } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { ParameterAction, ParameterReducer } from '@components/config/parameterReducer';

/**
 * This hook is used to initialize the parameters of the app.
 * It will get the parameters from Contentful and dispatch them to the reducer.
 *
 * @param dispatch a dispatch function from useReducer
 * @returns void
 */
const useInitializeParameters = (dispatch: Dispatch<ParameterReducer>) => {
  const sdk = useSDK<ConfigAppSDK>();

  const dispatchParameters = async () => {
    const parameters = await sdk.app.getParameters<AppInstallationParameters>();

    if (!parameters) return;

    dispatch({
      type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS,
      value: parameters,
    });

    sdk.app.setReady();
  };

  useEffect(() => {
    dispatchParameters();
  }, [sdk]);
};

export default useInitializeParameters;
