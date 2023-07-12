import { AppInstallationParameters } from './ConfigForm';

export enum ParameterAction {
  MODEL = 'model',
  APIKEY = 'apiKey',
  PROFILE = 'profile',
  CONTENTFUL_PARAMETERS = 'contentfulParameters',
}

const { MODEL, APIKEY, PROFILE, CONTENTFUL_PARAMETERS } = ParameterAction;

type ParameterStringActions = {
  type: typeof MODEL | typeof APIKEY | typeof PROFILE;
  value: string;
};
type ParameterObjectActions = {
  type: typeof CONTENTFUL_PARAMETERS;
  value: AppInstallationParameters;
};

export type ParameterActionType = ParameterStringActions | ParameterObjectActions;

const parameterReducer = (state: AppInstallationParameters, action: ParameterActionType) => {
  switch (action.type) {
    case MODEL:
      return { ...state, model: action.value };
    case APIKEY:
      return { ...state, apiKey: action.value };
    case PROFILE:
      return { ...state, profile: action.value };
    case CONTENTFUL_PARAMETERS:
      return { ...state, ...action.value };
    default:
      return state;
  }
};

export default parameterReducer;
