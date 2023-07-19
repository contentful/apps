import { AppActionCallContext } from '@contentful/node-apps-toolkit';

interface AppActionCallParameters {
  apiKey: string;
  sapApiEndpoint: string;
}

export const handler = async (payload: AppActionCallParameters, context: AppActionCallContext) => {
  const { sapApiEndpoint, apiKey } = payload;
  const headers = {
    'Content-Type': 'application/json',
    'application-interface-key': apiKey,
  };
  try {
    const res = await fetch(sapApiEndpoint, {
      method: 'GET',
      headers,
    });
    if (res.ok) {
      const body = await res.json();

      return {
        success: true,
        headers,
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
