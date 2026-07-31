import AppInstallationParameters, {
  PersistedInstallationParameters,
} from './appInstallationParameters';

export enum ParameterAction {
  UPDATE_MODEL = 'updateModel',
  UPDATE_PROFILE = 'updateProfile',
  UPDATE_BRAND_PROFILE = 'updateBrandProfile',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
}

type ParameterStringActions = {
  type: ParameterAction.UPDATE_MODEL;
  value: string;
};

type ParameterObjectActions = {
  type: ParameterAction.APPLY_CONTENTFUL_PARAMETERS;
  value: PersistedInstallationParameters;
};

type ParameterProfileAction = {
  type: ParameterAction.UPDATE_PROFILE;
  value: string;
  textLimit: number;
};

type ParameterBrandProfileActions = {
  type: ParameterAction.UPDATE_BRAND_PROFILE;
  field: string;
  value: string;
  textLimit: number;
};

export type ParameterReducer =
  | ParameterObjectActions
  | ParameterStringActions
  | ParameterProfileAction
  | ParameterBrandProfileActions;

const { UPDATE_MODEL, UPDATE_PROFILE, UPDATE_BRAND_PROFILE, APPLY_CONTENTFUL_PARAMETERS } =
  ParameterAction;

export type Validator<Type> = {
  [Key in keyof Type]: Type[Key] extends object
    ? Validator<Type[Key]>
    : {
        isValid: boolean;
        value: Type[Key];
      };
};

const parameterReducer = (
  state: Validator<AppInstallationParameters>,
  action: ParameterReducer
): Validator<AppInstallationParameters> => {
  switch (action.type) {
    case UPDATE_MODEL:
      return {
        ...state,
        model: {
          value: action.value,
          isValid: action.value.length > 0,
        },
      };
    case UPDATE_PROFILE: {
      const isValid = action.value.length <= action.textLimit;
      return {
        ...state,
        profile: {
          value: action.value,
          isValid,
        },
      };
    }
    case UPDATE_BRAND_PROFILE: {
      const isValid = action.value.length <= action.textLimit;
      return {
        ...state,
        brandProfile: {
          ...state.brandProfile,
          [action.field]: {
            value: action.value,
            isValid,
          },
        },
      };
    }
    case APPLY_CONTENTFUL_PARAMETERS: {
      // Persisted params are flat (see PersistedInstallationParameters); rehydrate
      // the nested brandProfile shape the config UI reducer works with.
      const parameter = action.value;
      return {
        ...state,
        model: {
          value: parameter.model,
          isValid: parameter.model?.length > 0,
        },
        profile: {
          value: parameter.profile || '',
          isValid: true,
        },
        brandProfile: {
          values: { value: parameter.values || '', isValid: true },
          tone: { value: parameter.tone || '', isValid: true },
          exclude: { value: parameter.exclude || '', isValid: true },
          include: { value: parameter.include || '', isValid: true },
          audience: { value: parameter.audience || '', isValid: true },
          additional: { value: parameter.additional || '', isValid: true },
        },
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
