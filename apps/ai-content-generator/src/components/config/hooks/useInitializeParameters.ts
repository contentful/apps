import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters } from '../ConfigForm';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Dispatch, useEffect, useState } from 'react';
import { ParameterAction, ParameterActionTypes } from '../parameterReducer';
import asyncWrapper from '@utils/asyncWrapper';

const useInitializeParameters = (dispatch: Dispatch<ParameterAction>) => {
  const sdk = useSDK<ConfigAppSDK>();
  const [isReady, setIsReady] = useState(false);

  const getCurrentParameters = async () => {
    if (isReady) {
      return;
    }

    const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();
    if (currentParameters) {
      dispatch({
        type: ParameterActionTypes.CONTENTFUL_PARAMETERS,
        value: currentParameters,
      });

      sdk.app.setReady();
      setIsReady(true);
    }
  };

  useEffect(asyncWrapper(getCurrentParameters), []);
};

export default useInitializeParameters;
