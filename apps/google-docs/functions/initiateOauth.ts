/*
 * INTEG-3271: Double check the imported types and make sure they work for Google Docs (use Klaviyo as a reference)
 */
import {
  OAuthInitResponse,
  OAuthExchangePayload,
  OAuthExchangeResponse,
  OAuthTokenResponse,
  AppEventHandlerRequest,
  OAuthResponseUrl,
  AppEventContext,
  AppEventHandlerResponse,
} from './types/oauth.types';

export type OAuthSDK = {
  init: () => Promise<OAuthInitResponse>;
  exchange: (payload: OAuthExchangePayload) => Promise<OAuthExchangeResponse>;
  token: () => Promise<OAuthTokenResponse>;
  revoke: () => Promise<void>;
};

export async function initiateOauth(sdk: OAuthSDK): Promise<OAuthResponseUrl> {
  try {
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
