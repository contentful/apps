import {
  CanonicalRequest,
  verifyRequest as defaultVerifyRequest,
} from '@contentful/node-apps-toolkit';
import { RequestHandler } from 'express';
import { IncomingHttpHeaders } from 'http';
import { NotFoundException } from '../../errors';

const DEFAULT_TTL = 300; // bump TTL to 5mins to avoid any retry issues with req verification

export function createContentfulRequestVerificationMiddleware(
  signingSecret: string,
  verifyRequest = defaultVerifyRequest,
): RequestHandler {
  return (request, _res, next) => {
    const isValid = verifyRequest(
      signingSecret,
      {
        method: request.method as CanonicalRequest['method'],
        path: request.publicPath,
        headers: dedupeHeaders(request.headers),
        body: (request.body as Buffer).toString('utf-8'),
      },
      DEFAULT_TTL,
    );

    if (!isValid) {
      throw new NotFoundException({ errMessage: 'Request verification is not valid' });
    }

    next();
  };
}

function dedupeHeaders(headers: IncomingHttpHeaders = {}): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [header, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      result[header] = value[0].toString();
    } else if (value) {
      result[header] = value.toString();
    }
  }
  return result;
}
