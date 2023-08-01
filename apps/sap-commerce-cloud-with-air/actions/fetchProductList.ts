import { AppActionCallContext } from '@contentful/node-apps-toolkit';

interface AppActionCallParameters {
  apiKey: string;
  sapApiEndpoint: string;
}

export const handler = async (payload: AppActionCallParameters, context: AppActionCallContext) => {
  const { sapApiEndpoint, apiKey } = payload;
  try {
    const res = await fetch(sapApiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'application-interface-key': apiKey,
      },
    });
    if (res.ok) {
      const body = await res.json();

      return {
        success: true,
        body,
      };
    }
  } catch (err) {
    return {
      success: false,
      body: err.message,
    };
  }
};
