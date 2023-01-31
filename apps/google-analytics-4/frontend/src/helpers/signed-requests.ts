import { CreateAppSignedRequestProps } from 'contentful-management/dist/typings/entities/app-signed-request';
import { PlainClientAPI } from 'contentful-management/dist/typings/plain/common-types';

async function fetchWithSignedRequest(
  url: URL,
  appDefinitionId: string,
  cma: PlainClientAPI,
  method: CreateAppSignedRequestProps['method'] = 'GET',
  headers: Record<string, string> = {}
): Promise<Response> {
  const req = {
    url: url,
    method: method,
    headers: headers,
  };

  // add request verification signing secret to request headers
  const { additionalHeaders } = await cma.appSignedRequest.create(
    {
      appDefinitionId: appDefinitionId,
    },
    {
      method: req.method,
      headers: req.headers,
      path: new URL(req.url).pathname,
    }
  );
  Object.assign(req.headers, additionalHeaders);

  return fetch(req.url, req);
}

export default fetchWithSignedRequest;
