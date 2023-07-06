import { AppActionCallContext } from '@contentful/node-apps-toolkit';

interface AppActionCallParameters {
  apiKey: string;
  sapApiEndpoint: string;
}

export const handler = async (payload: AppActionCallParameters, context: AppActionCallContext) => {
  const { sapApiEndpoint, apiKey } = payload;
  try {
    const req = await fetch(sapApiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'application-interface-key': apiKey,
      },
    });

    const res = await req.json();

    return {
      status: 'Success',
      baseSites: res.baseSites,
    };
  } catch (err) {
    return {
      status: 'Failed',
      body: err.message,
    };
  }
};
