import VercelClient from '@clients/Vercel';
import { ParameterAction } from '../../reducers/parameterReducer';
import { errorsActions, parametersActions } from '@constants/enums';
import { Dispatch } from 'react';
import { ErrorAction } from '@reducers/errorsReducer';
import { Errors } from '@customTypes/configPage';

export const validateToken = async (
  vercelClient: VercelClient,
  onComplete: (tokenValidity: boolean) => void,
  dispatchParameters: Dispatch<ParameterAction>,
  dispatchErrors: Dispatch<ErrorAction>
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

      dispatchErrors({
        type: errorsActions.RESET_AUTHENTICATION_ERRORS,
      });

      onComplete(response.ok);
    }
  } catch (e) {
    const err = e as Error;
    dispatchErrors({
      type: errorsActions.UPDATE_AUTHENTICATION_ERRORS,
      payload: (err.message as keyof Errors['authentication']) || 'invalidToken',
    });
  }
};
