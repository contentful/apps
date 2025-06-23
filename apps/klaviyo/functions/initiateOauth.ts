import {
  AppEventHandlerRequest,
  AppEventContext,
  AppEventHandlerResponse,
} from './entrySyncFunction';

interface OAuthResponseUrl {
  authorizationUrl: string;
}

interface OAuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

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

export async function initiateOauth(sdk: OAuthSDK): Promise<OAuthResponseUrl> {
  try {
    // Initialize OAuth flow using the SDK
    const oauthResponse = await sdk.init();

    return {
      authorizationUrl: oauthResponse.authorizeUrl,
    };
  } catch (error) {
    console.error('Failed to initialize OAuth flow:', error);
    throw new Error('Failed to initialize OAuth flow. Please try again.');
  }
}

export const handler = async (
  event: AppEventHandlerRequest,
  context: AppEventContext
): Promise<AppEventHandlerResponse> => {
  const sdk = (context as any).oauthSdk;

  if (!sdk) {
    console.error('No SDK available in context');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No SDK available in context' }),
    };
  }

  const oauthResponse = await initiateOauth(sdk);
  return oauthResponse;
};
