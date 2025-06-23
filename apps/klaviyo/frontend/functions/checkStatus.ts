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

export async function checkStatus(sdk: OAuthSDK): Promise<boolean> {
  try {
    const token = await sdk.token();
    console.log('Token:', token);
    if (!token) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Failed to complete OAuth flow:', error);
    return false;
  }
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', CompleteOAuthParams>,
  context: FunctionEventContext
): Promise<AppActionResponse> => {
  console.log('Complete OAuth Event:', event);
  const sdk = (context as any).oauthSdk;

  if (!sdk) {
    console.error('No SDK available in context');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No SDK available in context' }),
    };
  }
  console.log('Complete OAuth SDK:', sdk, event, context);

  const connected = await checkStatus(sdk);

  return {
    statusCode: 200,
    connected,
  };
};
