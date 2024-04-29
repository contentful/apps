import { initialErrors } from '@constants/defaultParams';
import { errorsActions } from '@constants/enums';
import { Errors } from '@customTypes/configPage';

type UpdateAuthenticationError = {
  type: errorsActions.UPDATE_AUTHENTICATION_ERRORS;
  payload: keyof Errors['authentication'];
};

type ResetAuthenticationErrors = {
  type: errorsActions.RESET_AUTHENTICATION_ERRORS;
};

type UpdateProjectSelectionError = {
  type: errorsActions.UPDATE_PROJECT_SELECTION_ERRORS;
  payload: keyof Errors['projectSelection'];
};

type UpdateApiPathSelectionError = {
  type: errorsActions.UPDATE_API_PATH_SELECTION_ERRORS;
  payload: keyof Errors['apiPathSelection'];
};

type UpdatePreviewPathError = {
  type: errorsActions.UPDATE_PREVIEW_PATH_ERRORS;
  payload: keyof Errors['previewPathSelection'];
};

type ResetPreviewPathErrors = {
  type: errorsActions.RESET_PREVIEW_PATH_ERRORS;
};

export type ErrorAction =
  | UpdateAuthenticationError
  | ResetAuthenticationErrors
  | UpdateProjectSelectionError
  | UpdateApiPathSelectionError
  | UpdatePreviewPathError
  | ResetPreviewPathErrors;

const {
  UPDATE_AUTHENTICATION_ERRORS,
  RESET_AUTHENTICATION_ERRORS,
  UPDATE_PROJECT_SELECTION_ERRORS,
  UPDATE_API_PATH_SELECTION_ERRORS,
  UPDATE_PREVIEW_PATH_ERRORS,
  RESET_PREVIEW_PATH_ERRORS,
} = errorsActions;

const errorsReducer = (state: Errors, action: ErrorAction): Errors => {
  switch (action.type) {
    case UPDATE_AUTHENTICATION_ERRORS: {
      const authErrorType = action.payload;
      return {
        ...state,
        authentication: {
          ...initialErrors.authentication,
          [authErrorType]: true,
        },
      };
    }
    case RESET_AUTHENTICATION_ERRORS: {
      return {
        ...state,
        authentication: {
          ...initialErrors.authentication,
        },
      };
    }
    case UPDATE_PROJECT_SELECTION_ERRORS: {
      const projectErrorType = action.payload;
      return {
        ...state,
        projectSelection: {
          ...initialErrors.projectSelection,
          [projectErrorType]: true,
        },
      };
    }
    case UPDATE_API_PATH_SELECTION_ERRORS: {
      const apiPathErrorType = action.payload;
      return {
        ...state,
        projectSelection: {
          ...initialErrors.projectSelection,
          [apiPathErrorType]: true,
        },
      };
    }
    case UPDATE_PREVIEW_PATH_ERRORS: {
      const previewPathErrorType = action.payload;
      return {
        ...state,
        previewPathSelection: {
          ...state.previewPathSelection,
          [previewPathErrorType]: true,
        },
      };
    }
    case RESET_PREVIEW_PATH_ERRORS: {
      return {
        ...state,
        previewPathSelection: {
          ...initialErrors.previewPathSelection,
        },
      };
    }
    default:
      return state;
  }
};

export default errorsReducer;
