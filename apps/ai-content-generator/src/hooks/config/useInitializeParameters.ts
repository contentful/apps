import { Dispatch, useEffect, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { ParameterAction, ParameterReducer } from '@components/config/parameterReducer';
import useInstallationParameters from '@hooks/common/useInstallationParameters';

/**
 * This hook is used to initialize the parameters of the app.
 * It will get the parameters from Contentful and dispatch them to the reducer.
 *
 * @param dispatch a dispatch function from useReducer
 * @returns void
 */
const useInitializeParameters = (dispatch: Dispatch<ParameterReducer>) => {
  const sdk = useSDK<ConfigAppSDK>();
  const parameters = useInstallationParameters();

  const dispatchParameters = useCallback(async () => {
    try {
      dispatch({
        type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS,
        value: parameters,
      });
    } catch (error) {
      console.error(error);
    } finally {
      sdk.app.setReady();
    }
  }, [sdk.app, parameters, dispatch]);

  useEffect(() => {
    dispatchParameters();
  }, [sdk, dispatchParameters]);
};

export default useInitializeParameters;
