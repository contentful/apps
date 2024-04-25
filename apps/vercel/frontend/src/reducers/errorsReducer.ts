import { errorsActions } from '@constants/enums';
import { Errors } from '@customTypes/configPage';

type AuthenticationError = {
  type: errorsActions.UPDATE_AUTHENTICATION_ERRORS;
  payload: keyof Errors['authentication'];
};

export type ErrorAction = AuthenticationError;

const { UPDATE_AUTHENTICATION_ERRORS } = errorsActions;

const errorsReducer = (state: Errors, action: ErrorAction): Errors => {
  switch (action.type) {
    case UPDATE_AUTHENTICATION_ERRORS:
      const errorType = action.payload;
      return {
        ...state,
        authentication: {
          ...state.authentication,
          [errorType]: true,
        },
      };
    default:
      return state;
  }
};

export default errorsReducer;
