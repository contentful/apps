import * as NodeAppsToolkit from '@contentful/node-apps-toolkit';
import { CanonicalRequest } from '@contentful/node-apps-toolkit/lib/requests/typings';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { InvalidSignature } from '../errors/invalidSignature';
import { UnableToVerifyRequest } from '../errors/unableToVerifyRequest';
import { config } from '../config';
import { isEmpty } from 'lodash';

export const verifySignedRequestMiddleware: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const canonicalReq = makeCanonicalReq(req);

    const signingSecret = config.signingSecret;
    let isValidReq = false;

    try {
      if (NodeAppsToolkit.verifyRequest(signingSecret, canonicalReq, 60)) {
        isValidReq = true;
      }
    } catch (e) {
      console.error(e);
      throw new UnableToVerifyRequest(`Unable to verify request: ${e}`);
    }

    if (!isValidReq) {
      throw new InvalidSignature(
        'Request does not have a valid request signature. ' +
          'See: https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/',
      );
    }
  } catch (e) {
    console.error(e);
    return next(e);
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
  const bodyOrUndefined = isEmpty(req.body) ? undefined : JSON.stringify(req.body);

  return <CanonicalRequest>{
    method: req.method,
    headers: headers,
    path: signedPath,
    body: bodyOrUndefined,
  };
};
