import { CMAClient } from '@contentful/app-sdk';
import { ServiceAccountKey } from '../types';
import { CreateAppSignedRequestProps } from 'contentful-management/dist/typings/entities/app-signed-request';

async function fetchWithSignedRequest(
  url: URL,
  appDefinitionId: string,
  cma: CMAClient,
  method: CreateAppSignedRequestProps['method'] = 'GET',
  unsignedHeaders: Record<string, string> = {},
  body?: ServiceAccountKey
): Promise<Response> {
  const req = {
    url: url,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const rootRelativePath = req.url.pathname;

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

  Object.assign(req.headers, unsignedHeaders, signedHeaders);

  return fetch(req.url, req);
}

export default fetchWithSignedRequest;
