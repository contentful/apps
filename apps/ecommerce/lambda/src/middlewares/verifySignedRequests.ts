import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { CanonicalRequest } from '@contentful/node-apps-toolkit/lib/requests/typings';
import { NextFunction, Request, Response } from 'express';
import { InvalidSignature } from '../errors/invalidSignature';
import { UnableToVerifyRequest } from '../errors/unableToVerifyRequest';
import { config } from '../config';

export const verifySignedRequestMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const signingSecrets = config.signingSecrets; // randomize order to avoid biased iteration?
  const canonicalReq = makeCanonicalReq(req);
  let isValidReq = false;

  const provider = req.header('X-Contentful-Data-Provider');
  if (provider) {
    const providerSecret = signingSecrets[provider];

    try {
      if (NodeAppsToolkit.verifyRequest(providerSecret, canonicalReq, 60)) {
        isValidReq = true;
      }
    } catch (e) {
      console.error(e);
      throw new UnableToVerifyRequest('Unable to verify request', {
        cause: e,
      });
    }
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
  const pathPrefix = config.stage !== 'prd' ? `/${config.stage}` : '';
  const fullPath = req.originalUrl.split('?')[0];
  const signedPath = `${pathPrefix}${fullPath}`; // note: req.originalUrl starts with a `/` and includes the full path & query string

  // express.json() makes body always an object ({}), even if there is no body
  // so we need to check if the body is empty and set it to undefined
  const bodyOrUndefined = Object.keys(req.body).length === 0 ? undefined : JSON.stringify(req.body);

  return <CanonicalRequest>{
    method: req.method,
    path: signedPath,
    headers: headers,
    body: bodyOrUndefined,
  };
};
