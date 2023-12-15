import { Dispatch, useEffect, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { ParameterAction, ParameterReducer } from '@components/config/parameterReducer';
import AppInstallationParameters from '@components/config/appInstallationParameters';

/**
 * This hook is used to initialize the parameters of the app.
 * It will get the parameters from Contentful and dispatch them to the reducer.
 *
 * @param dispatch a dispatch function from useReducer
 * @returns void
 */
const useInitializeParameters = (dispatch: Dispatch<ParameterReducer>) => {
  const sdk = useSDK<ConfigAppSDK>();

  const dispatchParameters = useCallback(async () => {
    try {
      const parameters = await sdk.app.getParameters<AppInstallationParameters>();

      // TOOD Handle error state here when it's freshly installed in a space
      if (!parameters) return;

      dispatch({
        type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS,
        value: parameters,
      });
    } catch (error) {
      console.error(error);
    } finally {
      sdk.app.setReady();
    }
  }, [dispatch, sdk.app]);

  useEffect(() => {
    dispatchParameters();
  }, [sdk, dispatchParameters]);
};

export default useInitializeParameters;
