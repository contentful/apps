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

export async function completeOauth(sdk: OAuthSDK, params: CompleteOAuthParams): Promise<void> {
  try {
    console.log('[OAuth] Completing OAuth exchange with code and state');
    const exchangeResult = await sdk.exchange({ code: params.code, state: params.state });
    console.log('[OAuth] OAuth exchange completed successfully:', {
      success: exchangeResult.success,
    });

    // Try to get the token immediately after exchange to log expiry info
    try {
      const token = await sdk.token();
      if (token) {
        const now = Date.now();
        const expiryTimestamp = token.expiry * 1000;
        const timeUntilExpiry = expiryTimestamp - now;
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

        console.log('[OAuth] Token obtained after exchange:', {
          tokenType: token.tokenType,
          expiryTimestamp: new Date(expiryTimestamp).toISOString(),
          hoursUntilExpiry: hoursUntilExpiry.toFixed(2),
          tokenLength: token.accessToken?.length || 0,
        });
      }
    } catch (tokenError) {
      console.warn('[OAuth] Could not fetch token immediately after exchange:', tokenError);
    }
  } catch (error) {
    console.error('[OAuth] Failed to complete OAuth flow:', {
      error,
      code: params.code ? 'present' : 'missing',
      state: params.state ? 'present' : 'missing',
    });
    throw new Error('Failed to complete OAuth flow. Please try again: ' + error);
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

  await completeOauth(sdk, {
    code: event.body.code || '',
    state: event.body.state || '',
  });

  return {
    statusCode: 200,
  };
};
