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
  body?: string | object,
): Promise<Response> {
  const req = {
    url,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...contentfulContextHeaders(sdk),
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
    },
  );

  Object.assign(req.headers, unsignedHeaders, signedHeaders);

  return fetch(req.url, req);
}

export default fetchWithSignedRequest;
