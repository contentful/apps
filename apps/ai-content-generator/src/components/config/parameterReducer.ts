import { AppInstallationParameters } from '@locations/ConfigScreen';

export enum ParameterAction {
  MODEL = 'model',
  APIKEY = 'apiKey',
  PROFILE = 'profile',
  CONTENTFUL_PARAMETERS = 'contentfulParameters',
}

type ParameterStringActions = {
  type: Exclude<ParameterAction, ParameterAction.CONTENTFUL_PARAMETERS>;
  value: string;
};
type ParameterObjectActions = {
  type: ParameterAction.CONTENTFUL_PARAMETERS;
  value: AppInstallationParameters;
};

export type ParameterReducer = ParameterObjectActions | ParameterStringActions;

const { MODEL, APIKEY, PROFILE, CONTENTFUL_PARAMETERS } = ParameterAction;
const parameterReducer = (state: AppInstallationParameters, action: ParameterReducer) => {
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
