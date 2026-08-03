import AppInstallationParameters, {
  PersistedInstallationParameters,
  ProfileFields,
  parseEnabledFeatures,
  toProfileType,
} from './appInstallationParameters';
import { AIFeature } from '@configs/features/featureConfig';

export enum ParameterAction {
  UPDATE_CREDENTIALS = 'updateCredentials',
  UPDATE_REGION = 'updateRegion',
  UPDATE_MODEL = 'updateModel',
  UPDATE_PROFILE = 'updateProfile',
  UPDATE_BRAND_PROFILE = 'updateBrandProfile',
  UPDATE_ENABLED_FEATURES = 'updateEnabledFeatures',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
}

type ParameterUpdateCredentialsAction = {
  type: ParameterAction.UPDATE_CREDENTIALS;
  value: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  isValid: boolean;
};

type ParameterUpdateRegionAction = {
  type: ParameterAction.UPDATE_REGION;
  value: string;
};

type ParameterStringActions = {
  type: ParameterAction.UPDATE_MODEL;
  value: string;
  isValid: boolean;
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

type ParameterUpdateEnabledFeaturesAction = {
  type: ParameterAction.UPDATE_ENABLED_FEATURES;
  value: AIFeature[];
};

export type ParameterReducer =
  | ParameterObjectActions
  | ParameterStringActions
  | ParameterProfileAction
  | ParameterBrandProfileActions
  | ParameterUpdateCredentialsAction
  | ParameterUpdateRegionAction
  | ParameterUpdateEnabledFeaturesAction;

/**
 * This is a recursive type that will validate the parameter
 * It first evaluates if the current key has a value that is an object
 * If it is an object, it will recursively call the type to validate the object
 */
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
    case ParameterAction.UPDATE_CREDENTIALS: {
      return {
        ...state,
        accessKeyId: {
          value: action.value.accessKeyId,
          isValid: action.isValid,
        },
        secretAccessKey: {
          value: action.value.secretAccessKey,
          isValid: action.isValid,
        },
      };
    }
    case ParameterAction.UPDATE_REGION: {
      return {
        ...state,
        region: {
          value: action.value,
          isValid: action.value.length > 0,
        },
      };
    }
    case ParameterAction.UPDATE_MODEL:
      return {
        ...state,
        model: {
          value: action.value,
          isValid: action.isValid,
        },
      };
    case ParameterAction.UPDATE_PROFILE: {
      const isValid = action.value.length <= action.textLimit;

      return {
        ...state,
        profile: {
          value: action.value,
          isValid,
        },
      };
    }
    case ParameterAction.UPDATE_BRAND_PROFILE: {
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
    case ParameterAction.UPDATE_ENABLED_FEATURES: {
      return {
        ...state,
        enabledFeatures: {
          value: action.value,
          isValid: action.value.length > 0,
        },
      };
    }
    case ParameterAction.APPLY_CONTENTFUL_PARAMETERS: {
      // Persisted params are flat (see PersistedInstallationParameters), but
      // installs from before the flatten migration still carry a nested
      // `brandProfile` and an `enabledFeatures` array (not a JSON string).
      // Dual-read both so existing customers keep their brand profile and
      // feature selection until they re-save, then rehydrate the nested shape
      // the config UI reducer works with.
      const parameter = action.value as PersistedInstallationParameters & {
        enabledFeatures?: AIFeature[] | string;
      };
      const profile = toProfileType(parameter);
      const enabledFeatures = parseEnabledFeatures(parameter.enabledFeatures);
      return {
        ...state,
        accessKeyId: {
          value: parameter.accessKeyId || '',
          isValid: (parameter.accessKeyId?.length ?? 0) > 0,
        },
        secretAccessKey: {
          value: parameter.secretAccessKey || '',
          isValid: (parameter.secretAccessKey?.length ?? 0) > 0,
        },
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
        enabledFeatures: {
          value: enabledFeatures,
          isValid: true,
        },
        region: {
          value: parameter.region,
          isValid: parameter.region?.length > 0,
        },
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
