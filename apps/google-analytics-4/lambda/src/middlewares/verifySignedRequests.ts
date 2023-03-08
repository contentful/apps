import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { CanonicalRequest } from '@contentful/node-apps-toolkit/lib/requests/typings';
import { NextFunction, Request, Response } from 'express';
import { InvalidSignature } from '../errors/invalidSignature';
import { UnableToVerifyRequest } from '../errors/unableToVerifyRequest';

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
  const headers = { ...req.headers };

  // coerce all headers to strings
  Object.keys(headers).forEach((key) => {
    headers[key] = headers[key]?.toString();
  });

  // TODO: make this stage prefixing logic better? (yuck)
  const pathPrefix = process.env.STAGE !== 'prd' ? `/${process.env.STAGE}` : '';

  return <CanonicalRequest>{
    method: req.method,
    path: `${pathPrefix}${req.originalUrl}`, // note: req.originalUrl starts with a `/`
    headers: headers,
  };
};
