import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2025-04-15';

type AppActionParameters = {
  data: any;
  privateKey: string;
  publicKey: string;
};

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  try {
    console.log('uploadContent App Action called', event);
    const { data, privateKey, publicKey } = event.body;
    if (!privateKey || !data) return { response: { error: 'Missing required parameters' } };
    const isUpdate = !!data.id;
    const method = isUpdate ? 'PATCH' : 'POST';
    const endpointType = data.objectType || 'template-universal-content';
    const endpoint = isUpdate ? `${endpointType}/${data.id}/` : `${endpointType}/`;
    const response = await fetch(`${KLAVIYO_API_URL}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `${publicKey}:${privateKey}`,
      },
      body: JSON.stringify(data.requestBody || data),
    });
    if (!response.ok) {
      throw new Error(`Klaviyo API error: ${response.status}`);
    }
    return {
      response: response.json(),
    };
  } catch (error) {
    console.error('uploadContent App Action error:', error);
    return {
      response: { error: 'An error occurred' },
    };
  }
};
