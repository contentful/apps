import { verifyRequest } from '@contentful/node-apps-toolkit';
import {
  CanonicalRequest,
  ContentfulContextHeader,
  ContentfulHeader,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import express from 'express';
import { InvalidSignature } from '../lib/errors/invalid-signature';
import { UnableToVerifyRequest } from '../lib/errors/unable-to-verify-request';
import { IncomingHttpHeaders } from 'http';

export const verifySignedRequestMiddleware = (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) => {
  const signingSecret = (process.env.SIGNING_SECRET || '').trim();
  const canonicalReq = makeCanonicalReq(req);
  let isValidReq = false;
  const TTL = 60; // TTL for signed requests (in seconds)

  try {
    isValidReq = verifyRequest(signingSecret, canonicalReq, TTL);
  } catch (e) {
    console.error(e);
    throw new UnableToVerifyRequest('Unable to verify request', {
      cause: e,
    });
  }

  if (!isValidReq) {
    throw new InvalidSignature(
      'Request does not have a valid request signature. ' +
        'See: https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/'
    );
  }

  next();
};

const makeCanonicalReq = (req: express.Request) => {
  const requiredHeaders = requestSigningHeaders(req.headers);

  return <CanonicalRequest>{
    method: req.method,
    path: `/${process.env.STAGE}${req.originalUrl}`,
    headers: requiredHeaders,
  };
};

const contentfulSigningHeaderKeys = [
  ...Object.values(ContentfulHeader),
  ...Object.values(ContentfulContextHeader),
];

interface ContentfulSignedHeaders {
  'x-contentful-timestamp': string;
  'x-contentful-signed-headers': string;
  'x-contentful-signature': string;
  'x-contentful-user-id': string;
  'x-contentful-space-id': string;
  'x-contentful-environment-id': string;
  'x-contentful-app-id': string;
  [key: string]: string;
}

function requestSigningHeaders(headers: IncomingHttpHeaders): Partial<ContentfulSignedHeaders> {
  const requiredSignatureHeaders = {} as Partial<ContentfulSignedHeaders>;
  for (const header of contentfulSigningHeaderKeys) {
    if (!headers[header]) continue;

    if (typeof headers[header] === 'string') {
      requiredSignatureHeaders[header] = headers[header] as string;
    } else {
      throw new UnableToVerifyRequest('Headers that are not a string');
    }
  }

  return requiredSignatureHeaders;
}
