import { AppEventHandlerRequest, AppEventHandlerResponse, AppEventContext } from './oauth.types';

export const handler = async (
  event: AppEventHandlerRequest,
  context: AppEventContext
): Promise<AppEventHandlerResponse> => {
  const sdk = (context as any).oauthSdk;

  try {
    await sdk.revoke();

    return {
      statusCode: 200,
    };
  } catch (error) {
    console.error('Error during disconnect:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to disconnect' }),
    };
  }
};
