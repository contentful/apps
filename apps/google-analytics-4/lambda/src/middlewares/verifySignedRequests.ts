import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import {
  CanonicalRequest,
  ContentfulContextHeader,
  ContentfulHeader,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { NextFunction, Request, Response } from 'express';
import { InvalidSignature } from '../errors/invalidSignature';
import { UnableToVerifyRequest } from '../errors/unableToVerifyRequest';
import { IncomingHttpHeaders } from 'http';

export const verifySignedRequestMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const signingSecret = (process.env.SIGNING_SECRET || '').trim();
  const canonicalReq = makeCanonicalReq(req);
  let isValidReq = false;

  console.log('signingSecret', signingSecret.replace(/.(?=.{4})/g, '*'));
  console.log('canonicalReq', canonicalReq);

  try {
    isValidReq = NodeAppsToolkit.verifyRequest(signingSecret, canonicalReq, 60); // 60 second TTL
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

const makeCanonicalReq = (req: Request) => {
  const requiredHeaders = requestSigningHeaders(req.headers);

  // TODO: make this stage prefixing logic better? (yuck)
  const pathPrefix = process.env.STAGE !== 'prd' ? `/${process.env.stage}` : '';

  return <CanonicalRequest>{
    method: req.method,
    path: `${pathPrefix}${req.originalUrl}`, // note: req.originalUrl starts with a `/`
    headers: requiredHeaders,
  };
};

const contentfulSigningHeaderKeys = [
  ...Object.values(ContentfulHeader),
  ...Object.values(ContentfulContextHeader),
];

interface ContentfulSignedHeaders {
  'X-Contentful-Timestamp': string;
  'X-Contentful-Signed-Headers': string;
  'X-Contentful-Signature': string;
  'X-Contentful-User-Id': string;
  'X-Contentful-Space-Id': string;
  'X-Contentful-Environment-Id': string;
  'X-Contentful-App-Id': string;
  [key: string]: string;
}

function requestSigningHeaders(headers: IncomingHttpHeaders): Partial<ContentfulSignedHeaders> {
  const requiredSignatureHeaders = {} as Partial<ContentfulSignedHeaders>;
  for (const header of contentfulSigningHeaderKeys) {
    if (!headers[header]) {
      console.log('missing request signing header: ', header);
      continue;
    }

    if (typeof headers[header] === 'string') {
      requiredSignatureHeaders[header] = headers[header] as string;
    } else {
      throw new UnableToVerifyRequest(`Header ${header} is not a string`);
    }
  }

  return requiredSignatureHeaders;
}
