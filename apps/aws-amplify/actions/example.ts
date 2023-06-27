import { AppActionCallContext } from '@contentful/node-apps-toolkit';

interface AppActionCallParameters {
  amplifyWebhookUrl: string;
}

export const handler = async (payload: AppActionCallParameters, context: AppActionCallContext) => {
  const { amplifyWebhookUrl } = payload;

  try {
    await fetch(amplifyWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
  } catch (err) {}

  return {
    message: 'Build successfully started',
  };
};
