import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import type { InitiateAsanaOAuthResponse } from '../src/types';

export type OAuthInitResponse = {
  authorizeUrl: string;
};

export type OAuthExchangePayload = {
  code: string;
  state: string;
};

export type OAuthExchangeResponse = {
  success: boolean;
};

export type OAuthTokenResponse = {
  tokenType: string;
  accessToken: string;
  expiry: number;
};

export type OAuthSDK = {
  init: () => Promise<OAuthInitResponse>;
  exchange: (payload: OAuthExchangePayload) => Promise<OAuthExchangeResponse>;
  token: () => Promise<OAuthTokenResponse>;
  revoke: () => Promise<void>;
};

export function getOAuthSdk(context: FunctionEventContext): OAuthSDK {
  const sdk = (context as unknown as { oauthSdk?: OAuthSDK }).oauthSdk;

  if (!sdk) {
    throw new Error('OAuth SDK is not available in this function context.');
  }

  return sdk;
}

export async function initiateOauth(sdk: OAuthSDK): Promise<InitiateAsanaOAuthResponse> {
  const oauthResponse = await sdk.init();
  return { authorizationUrl: oauthResponse.authorizeUrl };
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  _event: AppActionRequest<'Custom'>,
  context: FunctionEventContext
): Promise<InitiateAsanaOAuthResponse> => {
  const sdk = getOAuthSdk(context);
  return initiateOauth(sdk);
};
