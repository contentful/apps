import { AppInstallationParameters } from '../types';

export enum actions {
  UPDATE_VERCEL_ACCESS_TOKEN = 'updateVercelAccessToken',
  APPLY_CONTENTFUL_PARAMETERS = 'applyContentfulParameters',
}

type TenantIdAction = {
  type: actions.UPDATE_VERCEL_ACCESS_TOKEN;
  payload: string;
};

type ApplyContentfulParametersAction = {
  type: actions.APPLY_CONTENTFUL_PARAMETERS;
  payload: AppInstallationParameters;
};

export type ParameterAction = TenantIdAction | ApplyContentfulParametersAction;

const { UPDATE_VERCEL_ACCESS_TOKEN, APPLY_CONTENTFUL_PARAMETERS } = actions;

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
    case APPLY_CONTENTFUL_PARAMETERS: {
      const parameters = action.payload;
      return {
        ...state,
        vercelAccessToken: parameters.vercelAccessToken ?? '',
      };
    }
    default:
      return state;
  }
};

export default parameterReducer;
