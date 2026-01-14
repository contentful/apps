import { OAuthSDK } from './initiateOauth';
import {
  FunctionEventHandler,
  AppActionRequest,
  FunctionTypeEnum,
  AppActionResponse,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit';
interface CompleteOAuthParams {
  code: string;
  state: string;
}

interface CheckStatusResponse {
  token: string;
  connected: boolean;
}

export async function checkStatus(sdk: OAuthSDK): Promise<CheckStatusResponse> {
  try {
    const token = await sdk.token();
    if (!token) {
      console.log('[OAuth] Token check: No token returned from SDK');
      return { token: '', connected: false };
    }

    // Log token expiry information for debugging
    const now = Date.now();
    const expiryTimestamp = token.expiry * 1000; // Assuming expiry is in seconds
    const timeUntilExpiry = expiryTimestamp - now;
    const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);
    const isExpired = timeUntilExpiry <= 0;

    console.log('[OAuth] Token check details:', {
      hasToken: !!token.accessToken,
      tokenType: token.tokenType,
      expiryTimestamp: new Date(expiryTimestamp).toISOString(),
      currentTime: new Date(now).toISOString(),
      timeUntilExpiryMs: timeUntilExpiry,
      hoursUntilExpiry: hoursUntilExpiry.toFixed(2),
      isExpired,
      tokenLength: token.accessToken?.length || 0,
    });

    if (isExpired) {
      console.warn('[OAuth] Token is expired! SDK should have refreshed it automatically.');
    }

    return {
      token: token.accessToken,
      connected: true,
    };
  } catch (error) {
    console.error('[OAuth] Failed to get token from SDK:', { error });
    return { token: '', connected: false };
  }
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', CompleteOAuthParams>,
  context: FunctionEventContext
): Promise<AppActionResponse> => {
  const sdk = (context as any).oauthSdk;

  if (!sdk) {
    console.error('No SDK available in context');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No SDK available in context' }),
    };
  }

  const result = await checkStatus(sdk);

  return {
    statusCode: 200,
    ...result,
  };
};
