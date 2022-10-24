import { CanonicalRequest, getManagementToken, verifyRequest } from '@contentful/node-apps-toolkit';
import { IncomingHttpHeaders } from 'http';
import { StatusCodes } from 'http-status-codes';
import { Handler } from 'express';

import { sendError } from './utils';
import { createClient } from 'contentful-management';

const DEFAULT_TTL = 300;

const parseHeaders = (headers: IncomingHttpHeaders = {}): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [header, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      result[header] = value[0].toString();
    } else if (value) {
      result[header] = value.toString();
    }
  }
  return result;
};

interface MakeContentfulContextMiddlewareOptions {
  appDefinitionId: string;
  signingSecret: string;
  privateKey: string;
}

export function contentfulContext({
  signingSecret,
  appDefinitionId,
  privateKey,
}: MakeContentfulContextMiddlewareOptions): Handler {
  return async (request, response, next) => {
    const headers = parseHeaders(request.headers);

    const isVerified = verifyRequest(
      signingSecret,
      {
        method: request.method as CanonicalRequest['method'],
        path: request.url,
        headers,
        body: request.body,
      },
      DEFAULT_TTL
    );

    if (!isVerified) {
      return sendError(StatusCodes.NOT_FOUND, { response });
    }

    const spaceId = headers['x-contentful-space-id'];
    const environmentId = headers['x-contentful-environment-id'];
    const userId = headers['x-contentful-user-id'];
    const appId = headers['x-contentful-app-id'];

    const token = await getManagementToken(privateKey, {
      appInstallationId: appDefinitionId,
      environmentId,
      spaceId,
    });

    const cma = createClient(
      {
        accessToken: token,
      },
      {
        type: 'plain',
        defaults: {
          environmentId,
          spaceId,
        },
      }
    );

    const { parameters } = await cma.appInstallation.get({
      appDefinitionId,
      spaceId,
      environmentId,
    });

    request.contentfulContext = {
      appDefinitionId,
      appInstallationId: appDefinitionId,
      calleeId: userId || appId,
      environmentId,
      spaceId,
      cma,
      parameters,
    };

    next();
  };
}
