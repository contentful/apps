import VercelClient from '@clients/Vercel';
import { ParameterAction } from '../../reducers/parameterReducer';
import { parametersActions } from '@constants/enums';
import { Dispatch } from 'react';

export const validateToken = async (
  vercelClient: VercelClient,
  onComplete: (tokenValidity: boolean) => void,
  dispatchParameters: Dispatch<ParameterAction>
) => {
  try {
    const response = await vercelClient.checkToken();

    if (response) {
      if (response.data?.teamId) {
        dispatchParameters({
          type: parametersActions.APPLY_TEAM_ID,
          payload: response.data?.teamId,
        });
      }

      onComplete(response.ok);
    }
  } catch (e) {
    // dispatch error state here
    console.log('error state here>>>>>>>>', e);
  }
};
