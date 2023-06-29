import { AppActionCallContext } from '@contentful/node-apps-toolkit';

interface AppActionCallParameters {
  amplifyWebhookUrl: string;
}

export const handler = async (payload: AppActionCallParameters, context: AppActionCallContext) => {
  try {
    await fetch(payload.amplifyWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return {
      status: 'SUCCESS',
      message: 'Build successfully initialized',
    };
  } catch (err) {
    return {
      status: 'FAILED',
      message: err.message,
    };
  }
};
