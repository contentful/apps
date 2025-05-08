import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2025-04-15';

type AppActionParameters = {
  privateKey: string;
  publicKey: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  try {
    console.log('validateCredentials App Action called', event);
    const { privateKey, publicKey } = event.body;
    if (!privateKey) return { response: { error: 'Missing required parameters' } };
    const response = await fetch(`${KLAVIYO_API_URL}/accounts/`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `${publicKey}:${privateKey}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Klaviyo API error: ${response.status}`);
    }
    return {
      response: response.json(),
    };
  } catch (error) {
    console.error('validateCredentials App Action error:', error);
    return {
      response: { error: 'An error occurred' },
    };
  }
};
