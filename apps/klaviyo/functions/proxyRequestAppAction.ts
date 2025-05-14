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
    let { endpoint, method, data, params, privateKey, publicKey } = event.body;
    // Parse data and params if they are strings
    console.log('data', data);
    console.log('params', params);
    console.log('privateKey', privateKey);
    console.log('endpoint', endpoint);
    console.log('method', method);

    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse data:', e);
    }
    try {
      if (typeof params === 'string') {
        params = JSON.parse(params);
      }
    } catch (e) {
      console.error('Failed to parse params:', e);
    }
    if (!privateKey) {
      console.error('Missing private key');
      return { response: { error: 'Missing required private key' } };
    }
    if (!endpoint) {
      console.error('Missing endpoint');
      return { response: { error: 'Missing required endpoint' } };
    }
    if (!data) {
      console.error('Missing data');
      return { response: { error: 'Missing required data' } };
    }
    if (!params) {
      console.error('Missing params');
      return { response: { error: 'Missing required params' } };
    }
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
        Authorization: `Klaviyo-API-Key ${privateKey}`,
      },
    };
    if (fetchOptions.method === 'GET' && params) {
      url = buildUrlWithParams(url, params);
    } else if (fetchOptions.method !== 'GET') {
      fetchOptions.body = JSON.stringify(data);
    }
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(
        `Klaviyo API error: ${response.status}. ${response.statusText} ${JSON.stringify(
          response.body
        )} ${JSON.stringify(response)}`
      );
    }
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('proxyRequest App Action error:', error);
    return {
      response: { error: 'An error occurred' },
    };
  }
};
