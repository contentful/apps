import { Dispatch } from 'react';
import { useQuery } from 'react-query';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import getCurrentParameters from '@react-query/queries/getCurrentParameters';
import { AppInstallationParameters } from '@/components/config/ConfigForm';
import { ParameterAction, ParameterActionType } from '@components/config/parameterReducer';

const useInitializeParameters = (dispatch: Dispatch<ParameterActionType>) => {
  const sdk = useSDK<ConfigAppSDK>();

  const dispatchParameters = (parameters: AppInstallationParameters) => {
    if (!parameters) return;

    dispatch({
      type: ParameterAction.CONTENTFUL_PARAMETERS,
      value: parameters,
    });

    sdk.app.setReady();
  };

  useQuery(['appParameters'], getCurrentParameters(sdk), {
    onSuccess: dispatchParameters,
  });
};

export default useInitializeParameters;
