import type {
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
  AppActionRequest,
} from '@contentful/node-apps-toolkit';

const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_API_REVISION = '2025-04-15';
const ALLOWED_ENDPOINTS = ['template-universal-content', 'images'];

type AppActionParameters = {
  endpoint: string;
  method: string;
  data: any;
  params: any;
  privateKey: string;
  publicKey: string;
};

function buildUrlWithParams(url: string, params: Record<string, any> | undefined): string {
  if (!params) return url;
  const usp = new URLSearchParams(params);
  return url + (url.includes('?') ? '&' : '?') + usp.toString();
}

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AppActionParameters>,
  context: FunctionEventContext
) => {
  try {
    console.log('proxyRequest App Action called', event);
    const { endpoint, method, data, params, privateKey, publicKey } = event.body;
    if (!privateKey || !endpoint) return { response: { error: 'Missing required parameters' } };
    const baseEndpoint = endpoint.split('/')[0];
    if (!ALLOWED_ENDPOINTS.includes(baseEndpoint))
      return { response: { error: 'Endpoint not allowed' } };
    const formattedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    let url = `${KLAVIYO_API_URL}/${formattedEndpoint}`;
    let fetchOptions: RequestInit = {
      method: (method || 'GET').toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        revision: KLAVIYO_API_REVISION,
        Authorization: `${publicKey}:${privateKey}`,
      },
    };
    if (fetchOptions.method === 'GET' && params) {
      url = buildUrlWithParams(url, params);
    } else if (fetchOptions.method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`Klaviyo API error: ${response.status}`);
    }
    return {
      response: response.json(),
    };
  } catch (error) {
    console.error('proxyRequest App Action error:', error);
    return {
      response: { error: 'An error occurred' },
    };
  }
};
