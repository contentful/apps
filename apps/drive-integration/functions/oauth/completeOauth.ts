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
