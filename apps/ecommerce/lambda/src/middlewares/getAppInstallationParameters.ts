import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getManagementToken } from '@contentful/node-apps-toolkit';
import { UnableToGetAppInstallationParameters } from '../errors/unableToGetAppInstallationParameters';
import { AppInstallationParameters } from '../types';
import { UnableToGetAppAccessToken } from '../errors/unableToGetAppAccessToken';
import { getHost } from '../helpers/getHost';
import { createClient } from 'contentful-management';

export const getAppInstallationParametersMiddleware: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const installationParameters: AppInstallationParameters = {};

    // installation parameters are provided via x-data-provider-parameters header on GET requests
    // to check credentials prior to app installation / saving of app installation parameters
    const parametersHeader = req.header('x-data-provider-parameters');

    if (parametersHeader) {
      Object.assign(installationParameters, JSON.parse(parametersHeader));
    } else {
      const appId = req.header('x-contentful-app');
      const spaceId = req.header('x-contentful-space-id');
      const environmentId = req.header('x-contentful-environment-id');
      const host = getHost(req);

      if (!appId || !spaceId || !environmentId) {
        throw new Error('Missing required headers!');
      }

      if (!req.appConfig) throw new Error('App config not found');

      const appAccessToken = await getManagementToken(req.appConfig.privateKey, {
        appInstallationId: appId,
        spaceId,
        environmentId,
        host: `https://${host}`,
      })
        .then((token) => token)
        .catch((e) => {
          console.error(e.message);
          throw new UnableToGetAppAccessToken(e.message, {
            cause: e,
          });
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
      } catch (e: unknown) {
        console.error((e as { message: string }).message);
        throw new UnableToGetAppInstallationParameters(
          `Unable to get app installation parameters: cause: ${e}`
        );
      }
    }
    req.installationParameters = installationParameters;
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
