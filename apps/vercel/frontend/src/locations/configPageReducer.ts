import { configPageActions } from '@constants/enums';
import { ContentType } from '@contentful/app-sdk';
import { ApiPath, ConfigPageState, Project } from '@customTypes/configPage';
import VercelClient from '@clients/Vercel';

type ContentTypesAction = {
  type: configPageActions.UPDATE_CONTENT_TYPES;
  payload: ContentType[];
};

type ProjectsAction = {
  type: configPageActions.UPDATE_PROJECTS;
  payload: Project[];
};

type ApiPathsAction = {
  type: configPageActions.UPDATE_API_PATHS;
  payload: ApiPath[];
};

type VercelClientAction = {
  type: configPageActions.UPDATE_VERCEL_CLIENT;
  payload: VercelClient;
};

export type ParameterAction =
  | ContentTypesAction
  | ProjectsAction
  | ApiPathsAction
  | VercelClientAction;

const { UPDATE_CONTENT_TYPES, UPDATE_PROJECTS, UPDATE_API_PATHS, UPDATE_VERCEL_CLIENT } =
  configPageActions;

const configPageReducer = (state: ConfigPageState, action: ParameterAction): ConfigPageState => {
  switch (action.type) {
    case UPDATE_CONTENT_TYPES:
      return {
        ...state,
        contentTypes: action.payload,
      };
    case UPDATE_PROJECTS: {
      return {
        ...state,
        projects: action.payload,
      };
    }
    case UPDATE_API_PATHS: {
      return {
        ...state,
        apiPaths: action.payload,
      };
    }
    case UPDATE_VERCEL_CLIENT: {
      return {
        ...state,
        vercelClient: action.payload,
      };
    }
    default:
      return state;
  }
};

export default configPageReducer;
