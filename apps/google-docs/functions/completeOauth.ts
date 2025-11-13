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

/*
 * INTEG-3271: Double check the imported types and make sure they work for Google Docs (use Klaviyo as a reference)
 * Additionally, understand the implementation detail for the Google Docs OAuth flow (copied from Klaviyo)
 */
export async function completeOauth(sdk: OAuthSDK, params: CompleteOAuthParams): Promise<void> {
  try {
    // Complete the OAuth flow using the SDK
    await sdk.exchange({ code: params.code, state: params.state });
  } catch (error) {
    console.error('Failed to complete OAuth flow:', error);
    throw new Error('Failed to complete OAuth flow. Please try again: ' + error);
  }
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', CompleteOAuthParams>,
  context: FunctionEventContext
): Promise<AppActionResponse> => {
  console.log('in completeOauth handler');
  console.log('context', context);
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
