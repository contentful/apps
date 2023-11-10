import { Dispatch, useEffect, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { ParameterAction, actions } from '@components/config/parameterReducer';
import { AppInstallationParameters } from '@customTypes/configPage';

/**
 * This hook is used to initialize the parameters of the app.
 * It will get the parameters from Contentful and dispatch them to the reducer.
 *
 * @param dispatch a dispatch function from useReducer
 * @returns void
 */
const useInitializeParameters = (dispatch: Dispatch<ParameterAction>) => {
  const sdk = useSDK<ConfigAppSDK>();

  const dispatchParameters = useCallback(async () => {
    try {
      const parameters = await sdk.app.getParameters<AppInstallationParameters>();

      if (!parameters) return;

      dispatch({
        type: actions.APPLY_CONTENTFUL_PARAMETERS,
        payload: parameters,
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
