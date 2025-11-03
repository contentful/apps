import { AppEventHandlerResponse } from '@contentful/node-apps-toolkit';

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
} from './types/oauth.types';

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
  // Use the oauth sdk to initiate the oauth flow, use initiateOauth.ts from Klaviyo as a reference
  const sdk = (context as any).oauthSdk;
};
