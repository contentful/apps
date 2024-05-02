import { parametersActions } from '@constants/enums';
import {
  AppInstallationParameters,
  ApplyContentTypePreviewPathSelectionPayload,
  ContentTypePreviewPathSelection,
} from '@customTypes/configPage';

type VercelAccessTokenAction = {
  type: parametersActions.UPDATE_VERCEL_ACCESS_TOKEN;
  payload: string;
};

type VercelSelectedProjectAction = {
  type: parametersActions.APPLY_SELECTED_PROJECT;
  payload: string;
};

type ApplyContentfulParametersAction = {
  type: parametersActions.APPLY_CONTENTFUL_PARAMETERS;
  payload: AppInstallationParameters;
};

type AddContentTypePreviewPathSelectionAction = {
  type: parametersActions.ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION;
  payload: ApplyContentTypePreviewPathSelectionPayload;
};

type RemoveContentTypePreviewPathSelection = {
  type: parametersActions.REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION;
  payload: ContentTypePreviewPathSelection;
};

type ApplyApiPath = {
  type: parametersActions.APPLY_API_PATH;
  payload: string;
};

type ApplyTeamId = {
  type: parametersActions.APPLY_TEAM_ID;
  payload: string;
};

export type ParameterAction =
  | VercelAccessTokenAction
  | ApplyContentfulParametersAction
  | VercelSelectedProjectAction
  | AddContentTypePreviewPathSelectionAction
  | RemoveContentTypePreviewPathSelection
  | ApplyApiPath
  | ApplyTeamId;

const {
  UPDATE_VERCEL_ACCESS_TOKEN,
  APPLY_CONTENTFUL_PARAMETERS,
  APPLY_SELECTED_PROJECT,
  ADD_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
  REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION,
  APPLY_API_PATH,
  APPLY_TEAM_ID,
} = parametersActions;

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
    case APPLY_CONTENTFUL_PARAMETERS: {
      const parameters = action.payload;
      return {
        ...state,
        vercelAccessToken: parameters.vercelAccessToken,
        contentTypePreviewPathSelections: parameters.contentTypePreviewPathSelections,
        selectedProject: parameters.selectedProject,
        selectedApiPath: parameters.selectedApiPath,
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
      const { oldContentType, newContentType, newPreviewPath } = action.payload;
      const currentState = state.contentTypePreviewPathSelections;
      const manipulatedState = currentState.map((obj) => {
        if (obj.contentType === oldContentType) {
          obj.previewPath = newPreviewPath;
          obj.contentType = newContentType;
        }

        return obj;
      });
      const stateWithNewSelection = oldContentType
        ? manipulatedState
        : [...manipulatedState, { contentType: newContentType, previewPath: newPreviewPath }];
      return {
        ...state,
        contentTypePreviewPathSelections: stateWithNewSelection,
      };
    }
    case REMOVE_CONTENT_TYPE_PREVIEW_PATH_SELECTION: {
      const contentTypePreviewPathSelection = action.payload;
      const { contentType } = contentTypePreviewPathSelection;

      const filteredSelections = state.contentTypePreviewPathSelections.filter(
        (selection) => selection.contentType !== contentType
      );
      return {
        ...state,
        contentTypePreviewPathSelections: filteredSelections,
      };
    }
    case APPLY_API_PATH: {
      const apiPath = action.payload;
      return {
        ...state,
        selectedApiPath: apiPath,
      };
    }
    case APPLY_TEAM_ID: {
      const teamId = action.payload;
      return {
        ...state,
        teamId,
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
