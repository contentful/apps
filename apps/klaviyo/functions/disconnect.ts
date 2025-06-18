import { AppEventHandlerRequest } from './entrySyncFunction';
import { AppEventContext } from './entrySyncFunction';
import { AppEventHandlerResponse } from './entrySyncFunction';

export const handler = async (
  event: AppEventHandlerRequest,
  context: AppEventContext
): Promise<AppEventHandlerResponse> => {
  console.log('Disconnect Event:', event);
  const sdk = (context as any).oauthSdk;

  try {
    await sdk.disconnect();

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
