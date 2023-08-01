import { AppActionCallContext } from '@contentful/node-apps-toolkit';
import get from 'lodash.get';
import { Hash } from '../src/interfaces';

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

export const baseSiteTransformer =
  () =>
  (item: Hash): string => {
    return get(item, ['uid'], '');
  };
