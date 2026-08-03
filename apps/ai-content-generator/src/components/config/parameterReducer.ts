import AppInstallationParameters, {
  PersistedInstallationParameters,
  ProfileFields,
  toProfileType,
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
      // Persisted params are flat (see PersistedInstallationParameters), but
      // installs from before the flatten migration still carry a nested
      // `brandProfile`. Dual-read (flat first, nested fallback) so existing
      // customers keep their brand profile until they re-save, then rehydrate
      // the nested shape the config UI reducer works with.
      const parameter = action.value;
      const profile = toProfileType(parameter);
      return {
        ...state,
        model: {
          value: parameter.model,
          isValid: parameter.model?.length > 0,
        },
        profile: {
          value: profile[ProfileFields.PROFILE] || '',
          isValid: true,
        },
        brandProfile: {
          values: { value: profile[ProfileFields.VALUES] || '', isValid: true },
          tone: { value: profile[ProfileFields.TONE] || '', isValid: true },
          exclude: { value: profile[ProfileFields.EXCLUDE] || '', isValid: true },
          include: { value: profile[ProfileFields.INCLUDE] || '', isValid: true },
          audience: { value: profile[ProfileFields.AUDIENCE] || '', isValid: true },
          additional: { value: profile[ProfileFields.ADDITIONAL] || '', isValid: true },
        },
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
