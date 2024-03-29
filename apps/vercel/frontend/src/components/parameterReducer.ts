import { AppInstallationParameters, ContentTypePreviewPathSelection } from '../types';

export enum actions {
  UPDATE_VERCEL_ACCESS_TOKEN = 'updateVercelAccessToken',
  UPDATE_VERCEL_ACCESS_TOKEN_STATUS = 'updateVercelAccessTokenStatus',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
  APPLY_SELECTED_PROJECT = 'applySelectedProject',
  ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION = 'addContentTypePreviewPathSelection',
  REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION = 'removeContentTypePreviewPathSelection',
}

type VercelAccessTokenAction = {
  type: actions.UPDATE_VERCEL_ACCESS_TOKEN;
  payload: string;
};

type VercelAccessTokenStatusAction = {
  type: actions.UPDATE_VERCEL_ACCESS_TOKEN_STATUS;
  payload: boolean;
};

type VercelSelectedProjectAction = {
  type: actions.APPLY_SELECTED_PROJECT;
  payload: string;
};

type ApplyContentfulParametersAction = {
  type: actions.APPLY_CONTENTFUL_PARAMETERS;
  payload: AppInstallationParameters;
};

type AddContentTypePreviewPathSelectionAction = {
  type: actions.ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION;
  payload: ContentTypePreviewPathSelection;
};

type RemoveContentTypePreviewPathSelection = {
  type: actions.REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION;
  payload: ContentTypePreviewPathSelection;
};

export type ParameterAction =
  | VercelAccessTokenAction
  | ApplyContentfulParametersAction
  | VercelSelectedProjectAction
  | VercelAccessTokenStatusAction
  | AddContentTypePreviewPathSelectionAction
  | RemoveContentTypePreviewPathSelection;

const {
  UPDATE_VERCEL_ACCESS_TOKEN,
  UPDATE_VERCEL_ACCESS_TOKEN_STATUS,
  APPLY_CONTENTFUL_PARAMETERS,
  APPLY_SELECTED_PROJECT,
  ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
  REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
} = actions;

const parameterReducer = (
  state: AppInstallationParameters,
  action: ParameterAction
): AppInstallationParameters => {
  switch (action.type) {
    case UPDATE_VERCEL_ACCESS_TOKEN:
      return {
        ...state,
        vercelAccessToken: action.payload,
      };
    case UPDATE_VERCEL_ACCESS_TOKEN_STATUS:
      return {
        ...state,
        vercelAccessTokenStatus: action.payload,
      };
    case APPLY_CONTENTFUL_PARAMETERS: {
      const parameters = action.payload;
      return {
        ...state,
        vercelAccessToken: parameters.vercelAccessToken,
        contentTypePreviewPathSelections: parameters.contentTypePreviewPathSelections,
        selectedProject: parameters.selectedProject,
      };
    }
    case APPLY_SELECTED_PROJECT: {
      const selectedProject = action.payload;
      return {
        ...state,
        selectedProject: selectedProject,
      };
    }
    case ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION: {
      const contentTypePreviewPathSelection = action.payload;
      const currentState = state.contentTypePreviewPathSelections || [];
      return {
        ...state,
        contentTypePreviewPathSelections: [...currentState, contentTypePreviewPathSelection],
      };
    }
    case REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION: {
      const contentTypePreviewPathSelection = action.payload;
      const { contentType, previewPath } = contentTypePreviewPathSelection;

      const filteredSelections = state.contentTypePreviewPathSelections.filter(
        (selection) =>
          selection.contentType !== contentType && selection.previewPath !== previewPath
      );
      return {
        ...state,
        contentTypePreviewPathSelections: filteredSelections,
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
