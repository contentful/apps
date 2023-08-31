import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getManagementToken } from '@contentful/node-apps-toolkit';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { UnableToGetAppInstallationParameters } from '../errors/unableToGetAppInstallationParameters';
import { AppInstallationParameters } from '../types/types';
import { UnableToGetAppAccessToken } from '../errors/unableToGetAppAccessToken';
import { getHost } from '../utils/utils';
import { createClient } from 'contentful-management';

export const getAppInstallationParametersMiddleware: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const installationParameters: AppInstallationParameters = {};

    const appId = JSON.parse(JSON.stringify(req.header('x-contentful-app')));
    const spaceId = JSON.parse(JSON.stringify(req.header('x-contentful-space-id')));
    const environmentId = JSON.parse(JSON.stringify(req.header('x-contentful-environment-id')));
    const host = getHost(req);
    req.params.appId = appId;
    req.params.spaceId = spaceId;
    req.params.environmentId = environmentId;

    if (!appId || !spaceId || !environmentId) {
      throw new Error('Missing required headers!');
    }

    let privateKey = config.privateKey;
    if (privateKey.endsWith('.pem')) {
      privateKey = fs.readFileSync(path.join(__dirname, '../../', privateKey), {
        encoding: 'utf8',
      });
    }

    const appAccessToken = await getManagementToken(privateKey, {
      appInstallationId: appId,
      spaceId,
      environmentId,
      host,
    })
      .then((token) => token)
      .catch((e) => {
        console.error(e.message);
        throw new UnableToGetAppAccessToken(`${e.message}: ${e}`);
      });

    try {
      const cmaClient = createClient(
        {
          accessToken: appAccessToken,
          host,
        },
        {
          type: 'plain',
          defaults: {
            spaceId,
            environmentId,
          },
        }
      );

      const appInstallation = await cmaClient.appInstallation.get({
        appDefinitionId: appId,
      });
      Object.assign(installationParameters, appInstallation.parameters);

      req.installationParameters = installationParameters;
    } catch (e: any) {
      console.error(e.message);
      throw new UnableToGetAppInstallationParameters(
        `Unable to get app installation parameters: cause: ${e}`
      );
    }
  } catch (e) {
    console.error(e);
    return next(e);
  }

  next();
};

declare module 'http' {
  interface IncomingMessage {
    installationParameters: AppInstallationParameters;
  }
}
