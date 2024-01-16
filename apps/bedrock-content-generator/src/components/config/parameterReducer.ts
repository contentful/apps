import AppInstallationParameters from "./appInstallationParameters";

export enum ParameterAction {
  UPDATE_CREDENTIALS = "updateCredentials",
  UPDATE_REGION = "updateRegion",
  UPDATE_MODEL = "updateModel",
  UPDATE_PROFILE = "updateProfile",
  UPDATE_BRAND_PROFILE = "updateBrandProfile",
  APPLY_CONTENTFUL_PARAMETERS = "applyContentfulParameters",
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
  value: AppInstallationParameters;
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
  | ParameterBrandProfileActions
  | ParameterUpdateCredentialsAction
  | ParameterUpdateRegionAction;

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
  action: ParameterReducer,
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
    case ParameterAction.APPLY_CONTENTFUL_PARAMETERS: {
      const parameter = action.value as AppInstallationParameters;
      return {
        ...state,

        model: {
          value: parameter.model,
          isValid: parameter.model?.length > 0,
        },
        profile: {
          value: parameter.profile,
          isValid: true,
        },
        brandProfile: {
          values: {
            value: parameter.brandProfile?.values || "",
            isValid: true,
          },
          tone: {
            value: parameter.brandProfile?.tone || "",
            isValid: true,
          },
          exclude: {
            value: parameter.brandProfile?.exclude || "",
            isValid: true,
          },
          include: {
            value: parameter.brandProfile?.include || "",
            isValid: true,
          },
          audience: {
            value: parameter.brandProfile?.audience || "",
            isValid: true,
          },
          additional: {
            value: parameter.brandProfile?.additional || "",
            isValid: true,
          },
        },
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
