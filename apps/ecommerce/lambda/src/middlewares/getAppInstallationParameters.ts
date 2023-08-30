import { NextFunction, Request, RequestHandler, Response } from 'express';
import { getManagementToken } from '@contentful/node-apps-toolkit';
import axios from 'axios';
import { UnableToGetAppInstallationParameters } from '../errors/unableToGetAppInstallationParameters';
import { AppInstallationParameters } from '../types';
import { UnableToGetAppAccessToken } from '../errors/unableToGetAppAccessToken';

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

      const crn = req.header('x-contentful-crn') || 'default:contentful'; // Bandaid to default to US region
      const partition = crn.split(':')[1];

      let host;
      switch (partition) {
        case 'contentful':
          host = 'api.contentful.com';
          break;
        case 'contentful-eu':
          host = 'api.eu.contentful.com';
          break;
      }

      if (!appId || !spaceId || !environmentId) {
        throw new Error('Missing required headers!');
      }

      if (!req.appConfig) throw new Error('App config not found');

      const appAccessToken = await getManagementToken(req.appConfig.privateKey, {
        appInstallationId: appId,
        spaceId,
        environmentId,
        host,
      })
        .then((token) => token)
        .catch((e) => {
          console.error(e.message);
          throw new UnableToGetAppAccessToken(e.message, {
            cause: e,
          });
        });

      // get installation parameters from via CMA
      await axios
        .get(
          `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/app_installations/${appId}`,
          {
            headers: {
              Authorization: `Bearer ${appAccessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        .then((response) => {
          const appInstallation = response.data;
          Object.assign(installationParameters, appInstallation.parameters);
        })
        .catch((e) => {
          console.error(e.message);
          throw new UnableToGetAppInstallationParameters(
            'Unable to get app installation parameters',
            {
              cause: e,
            }
          );
        });
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
