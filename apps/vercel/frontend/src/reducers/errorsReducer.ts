import { initialErrors } from '@constants/defaultParams';
import { errorsActions } from '@constants/enums';
import { Errors, PreviewPathError } from '@customTypes/configPage';

type UpdateAuthenticationError = {
  type: errorsActions.UPDATE_AUTHENTICATION_ERRORS;
  payload: keyof Errors['authentication'];
};


type ResetAuthenticationErrors = {
  type: errorsActions.RESET_AUTHENTICATION_ERRORS;
};

type UpdateContentfulPreviewSecretError = {
  type: errorsActions.UPDATE_CONTENTFUL_PREVIEW_SECRET_ERRORS;
  payload: keyof Errors['contentfulPreviewSecret'];
};

type ResetContentfulPreviewSecretErrors = {
  type: errorsActions.RESET_CONTENTFUL_PREVIEW_SECRET_ERRORS;
};

type UpdateProjectSelectionError = {
  type: errorsActions.UPDATE_PROJECT_SELECTION_ERRORS;
  payload: keyof Errors['projectSelection'];
};

type ResetProjectSelectionErrors = {
  type: errorsActions.RESET_PROJECT_SELECTION_ERRORS;
};

type UpdateApiPathSelectionError = {
  type: errorsActions.UPDATE_API_PATH_SELECTION_ERRORS;
  payload: keyof Errors['apiPathSelection'];
};

type ResetApiPathSelectionErrors = {
  type: errorsActions.RESET_API_PATH_SELECTION_ERRORS;
};

type UpdatePreviewPathError = {
  type: errorsActions.UPDATE_PREVIEW_PATH_ERRORS;
  payload: PreviewPathError;
};

type ResetPreviewPathErrors = {
  type: errorsActions.RESET_PREVIEW_PATH_ERRORS;
};

export type ErrorAction =
  | UpdateAuthenticationError
  | ResetAuthenticationErrors
  | UpdateContentfulPreviewSecretError
  | ResetContentfulPreviewSecretErrors
  | UpdateProjectSelectionError
  | ResetProjectSelectionErrors
  | UpdateApiPathSelectionError
  | ResetApiPathSelectionErrors
  | UpdatePreviewPathError
  | ResetPreviewPathErrors;

const {
  UPDATE_AUTHENTICATION_ERRORS,
  RESET_AUTHENTICATION_ERRORS,
  UPDATE_CONTENTFUL_PREVIEW_SECRET_ERRORS,
  RESET_CONTENTFUL_PREVIEW_SECRET_ERRORS,
  UPDATE_PROJECT_SELECTION_ERRORS,
  UPDATE_API_PATH_SELECTION_ERRORS,
  UPDATE_PREVIEW_PATH_ERRORS,
  RESET_PREVIEW_PATH_ERRORS,
  RESET_API_PATH_SELECTION_ERRORS,
  RESET_PROJECT_SELECTION_ERRORS,
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

    case UPDATE_CONTENTFUL_PREVIEW_SECRET_ERRORS: {
      const contentfulErrorType = action.payload;
      return {
        ...state,
        contentfulPreviewSecret: {
          ...initialErrors.contentfulPreviewSecret,
          [contentfulErrorType]: true,
        },
      };
    }
    case RESET_CONTENTFUL_PREVIEW_SECRET_ERRORS: {
      return {
        ...state,
        contentfulPreviewSecret: {
          ...initialErrors.contentfulPreviewSecret,
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
    case RESET_PROJECT_SELECTION_ERRORS: {
      return {
        ...state,
        projectSelection: {
          ...initialErrors.projectSelection,
        },
      };
    }
    case UPDATE_API_PATH_SELECTION_ERRORS: {
      const apiPathErrorType = action.payload;
      return {
        ...state,
        apiPathSelection: {
          ...initialErrors.apiPathSelection,
          [apiPathErrorType]: true,
        },
      };
    }
    case RESET_API_PATH_SELECTION_ERRORS: {
      return {
        ...state,
        apiPathSelection: {
          ...initialErrors.apiPathSelection,
        },
      };
    }
    case UPDATE_PREVIEW_PATH_ERRORS: {
      const pathError = action.payload;
      const isDuplicateRowError = state.previewPathSelection.some(
        (prevPathError) => prevPathError.contentType === pathError.contentType
      );
      const newErrors = state.previewPathSelection.map((existingError) => {
        if (existingError.contentType === pathError.contentType) {
          existingError.contentType = pathError.contentType;
          existingError.emptyPreviewPathInput = pathError.emptyPreviewPathInput;
          existingError.invalidPreviewPathFormat = pathError.invalidPreviewPathFormat;
        }
        return existingError;
      });
      const previewPathErrors = isDuplicateRowError ? newErrors : [...newErrors, pathError];
      return {
        ...state,
        previewPathSelection: previewPathErrors,
      };
    }
    case RESET_PREVIEW_PATH_ERRORS: {
      return {
        ...state,
        previewPathSelection: [...initialErrors.previewPathSelection],
      };
    }
    default:
      return state;
  }
};

export default errorsReducer;
