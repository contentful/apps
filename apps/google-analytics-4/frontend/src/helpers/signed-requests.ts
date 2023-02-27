import { CreateAppSignedRequestProps } from 'contentful-management/dist/typings/entities/app-signed-request';
import { PlainClientAPI } from 'contentful-management/dist/typings/plain/common-types';

async function fetchWithSignedRequest(
  url: URL,
  appDefinitionId: string,
  cma: PlainClientAPI,
  method: CreateAppSignedRequestProps['method'] = 'GET',
  unsignedHeaders: Record<string, string> = {}
): Promise<Response> {
  const req = {
    url: url,
    method: method,
    headers: {},
  };

  // add request verification signing secret to request headers
  const { additionalHeaders: signedHeaders } = await cma.appSignedRequest.create(
    {
      appDefinitionId: appDefinitionId,
    },
    {
      method: req.method,
      headers: req.headers,
      path: new URL(req.url).pathname,
    }
  );
  Object.assign(req.headers, unsignedHeaders, signedHeaders);

  return fetch(req.url, req);
}

export default fetchWithSignedRequest;
