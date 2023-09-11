import { AppInstallationParameters } from '@locations/ConfigScreen';

export enum ParameterAction {
  UPDATE_MODEL = 'updateModel',
  UPDATE_APIKEY = 'updateApiKey',
  UPDATE_PROFILE = 'updateProfile',
  UPDATE_BRAND_PROFILE = 'updateBrandProfile',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
}

type ParameterStringActions = {
  type: Exclude<
    ParameterAction,
    ParameterAction.APPLY_CONTENTFUL_PARAMETERS | ParameterAction.UPDATE_BRAND_PROFILE
  >;
  value: string;
};

type ParameterObjectActions = {
  type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS;
  value: AppInstallationParameters;
};

type ParameterProfileActions = {
  type: ParameterAction.UPDATE_BRAND_PROFILE;
  field: string;
  value: string;
};

export type ParameterReducer =
  | ParameterObjectActions
  | ParameterStringActions
  | ParameterProfileActions;

const {
  UPDATE_MODEL,
  UPDATE_APIKEY,
  UPDATE_PROFILE,
  UPDATE_BRAND_PROFILE,
  APPLY_CONTENTFUL_PARAMETERS,
} = ParameterAction;

const parameterReducer = (state: AppInstallationParameters, action: ParameterReducer) => {
  switch (action.type) {
    case UPDATE_MODEL:
      return { ...state, model: action.value };
    case UPDATE_APIKEY:
      return { ...state, key: action.value };
    case UPDATE_PROFILE:
      return { ...state, profile: action.value };
    case UPDATE_BRAND_PROFILE:
      return {
        ...state,
        brandProfile: {
          ...state.brandProfile,
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
