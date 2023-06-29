import { CMAClient, KnownAppSDK } from '@contentful/app-sdk';
import { CreateAppSignedRequestProps } from 'contentful-management/dist/typings/entities/app-signed-request';
import { PlainClientAPI } from 'contentful-management/dist/typings/plain/common-types';
import { contentfulContextHeaders } from './contentfulContext';

async function fetchWithSignedRequest(
  url: URL,
  appDefinitionId: string,
  cma: PlainClientAPI | CMAClient,
  sdk: KnownAppSDK,
  method: CreateAppSignedRequestProps['method'] = 'GET',
  unsignedHeaders: Record<string, string> = {},
  body?: string | object
): Promise<Response> {
  const req = {
    url: url,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      ...contentfulContextHeaders(sdk),
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  console.log('req', req);
  const rootRelativePath = req.url.pathname;

  console.log('BEFORE CMA REQUEST CREATE', req);

  // add request verification signing secret to request headers
  const { additionalHeaders: signedHeaders } = await cma.appSignedRequest.create(
    {
      appDefinitionId: appDefinitionId,
    },
    {
      method: req.method,
      headers: req.headers,
      path: rootRelativePath,
      body: req.body,
    }
  );
  console.log('AFTER CMA REQUEST CREATE');

  Object.assign(req.headers, unsignedHeaders, signedHeaders);

  console.log('reqURL', req.url);

  return fetch(req.url, req);
}

export default fetchWithSignedRequest;
