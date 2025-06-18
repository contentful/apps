import { AppExtensionSDK } from '@contentful/app-sdk';
import { AppEventHandlerRequest } from './entrySyncFunction';
import { AppEventContext } from './entrySyncFunction';
import { AppEventHandlerResponse } from './entrySyncFunction';
import { OAuthSDK } from './initiateOauth';
interface CompleteOAuthParams {
  code: string;
  state: string;
}

export async function completeOauth(sdk: OAuthSDK, params: CompleteOAuthParams): Promise<void> {
  try {
    // Complete the OAuth flow using the SDK
    await sdk.completeOAuth(params.code, params.state);
  } catch (error) {
    console.error('Failed to complete OAuth flow:', error);
    throw new Error('Failed to complete OAuth flow. Please try again: ' + error);
  }
}

export const handler = async (
  event: AppEventHandlerRequest,
  context: AppEventContext
): Promise<AppEventHandlerResponse> => {
  console.log('Complete OAuth Event:', event);
  const sdk = (context as any).oauthSdk;

  if (!sdk) {
    console.error('No SDK available in context');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No SDK available in context' }),
    };
  }
  console.log('Complete OAuth SDK:', sdk, event.code, event.state);

  await completeOauth(sdk, {
    code: event.code || '',
    state: event.state || '',
  });

  return {
    statusCode: 200,
  };
};
