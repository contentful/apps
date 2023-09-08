import { Dispatch, useEffect, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { ParameterAction, ParameterReducer } from '@components/config/parameterReducer';
import { mapV1ParamsToV2 } from '@utils/config/parameterHelpers';

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
      const parameters = await sdk.app.getParameters();

      // TOOD Handle error state here when it's freshly installed in a space
      if (!parameters) return;

      let newParameters = {};

      if (parameters.version !== 2) {
        newParameters = { ...mapV1ParamsToV2(parameters) };
      } else {
        newParameters = { ...parameters };
      }

      dispatch({
        type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS,
        value: newParameters as AppInstallationParameters,
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
