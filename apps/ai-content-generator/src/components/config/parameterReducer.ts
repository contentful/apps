import { AppInstallationParameters } from '@locations/ConfigScreen';

export enum ParameterAction {
  UPDATE_MODEL = 'updateModel',
  UPDATE_APIKEY = 'updateApiKey',
  UPDATE_PROFILE = 'updateProfile',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
}

type ParameterStringActions = {
  type: Exclude<
    ParameterAction,
    ParameterAction.APPLY_CONTENTFUL_PARAMETERS | ParameterAction.UPDATE_PROFILE
  >;
  value: string;
};

type ParameterObjectActions = {
  type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS;
  value: AppInstallationParameters;
};

type ParameterProfileActions = {
  type: ParameterAction.UPDATE_PROFILE;
  field: string;
  value: string;
};

export type ParameterReducer =
  | ParameterObjectActions
  | ParameterStringActions
  | ParameterProfileActions;

const { UPDATE_MODEL, UPDATE_APIKEY, UPDATE_PROFILE, APPLY_CONTENTFUL_PARAMETERS } =
  ParameterAction;

const parameterReducer = (state: AppInstallationParameters, action: ParameterReducer) => {
  switch (action.type) {
    case UPDATE_MODEL:
      return { ...state, model: action.value };
    case UPDATE_APIKEY:
      return { ...state, apiKey: action.value };
    case UPDATE_PROFILE:
      return {
        ...state,
        profile: {
          ...state.profile,
          [action.field]: action.value,
        },
      };
    case APPLY_CONTENTFUL_PARAMETERS:
      return { ...state, ...action.value };
    default:
      return state;
  }
};

export default parameterReducer;
