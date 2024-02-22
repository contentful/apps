import { ContentType } from '@contentful/app-sdk';
import { AppInstallationParameters, Project } from '../types';

export enum actions {
  UPDATE_VERCEL_ACCESS_TOKEN = 'updateVercelAccessToken',
  UPDATE_VERCEL_ACCESS_TOKEN_STATUS = 'updateVercelAccessTokenStatus',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
  UPDATE_VERCEL_PROJECTS = 'updateVercelProjects',
  APPLY_SELECTED_PROJECT = 'applySelectedProject',
  UPDATE_CONTENT_TYPES = 'updateContentTypes',
  APPLY_SELECTED_CONTENT_TYPE = 'applySelectedContentType',
}

type VercelAccessTokenAction = {
  type: actions.UPDATE_VERCEL_ACCESS_TOKEN;
  payload: string;
};

type VercelAccessTokenStatusAction = {
  type: actions.UPDATE_VERCEL_ACCESS_TOKEN_STATUS;
  payload: boolean;
};

type VercelProjectsAction = {
  type: actions.UPDATE_VERCEL_PROJECTS;
  payload: Project[];
};

type VercelSelectedProjectAction = {
  type: actions.APPLY_SELECTED_PROJECT;
  payload: string;
};

type ContentTypesAction = {
  type: actions.UPDATE_CONTENT_TYPES;
  payload: ContentType[];
};

type SelectedContentTypeAction = {
  type: actions.APPLY_SELECTED_CONTENT_TYPE;
  payload: string;
};

type ApplyContentfulParametersAction = {
  type: actions.APPLY_CONTENTFUL_PARAMETERS;
  payload: AppInstallationParameters;
};

export type ParameterAction =
  | VercelAccessTokenAction
  | ApplyContentfulParametersAction
  | VercelProjectsAction
  | VercelSelectedProjectAction
  | VercelAccessTokenStatusAction
  | ContentTypesAction
  | SelectedContentTypeAction;

const {
  UPDATE_VERCEL_ACCESS_TOKEN,
  UPDATE_VERCEL_ACCESS_TOKEN_STATUS,
  APPLY_CONTENTFUL_PARAMETERS,
  UPDATE_VERCEL_PROJECTS,
  APPLY_SELECTED_PROJECT,
  UPDATE_CONTENT_TYPES,
  APPLY_SELECTED_CONTENT_TYPE,
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
        vercelAccessToken: parameters.vercelAccessToken ?? '',
      };
    }
    case UPDATE_VERCEL_PROJECTS: {
      const projects = action.payload;
      return {
        ...state,
        projects: projects ?? [],
      };
    }
    case APPLY_SELECTED_PROJECT: {
      const selectedProject = action.payload;
      return {
        ...state,
        selectedProject: selectedProject ?? '',
      };
    }
    case UPDATE_CONTENT_TYPES: {
      const contentTypes = action.payload;
      return {
        ...state,
        contentTypes: contentTypes ?? [],
      };
    }
    case APPLY_SELECTED_CONTENT_TYPE: {
      const selectedContentType = action.payload;
      return {
        ...state,
        selectedContentType: selectedContentType ?? '',
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
