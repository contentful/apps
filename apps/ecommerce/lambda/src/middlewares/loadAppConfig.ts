import { NextFunction, Request, RequestHandler, Response } from 'express';
import { config } from '../config';
import { isEqual } from 'lodash';
import { AppConfiguration } from '../types';

export const loadAppConfigMiddleware: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const appId = req.header('x-contentful-app');

    const appConfig: AppConfiguration = config.appConfigs.find(
      (config: { [key: string]: string }) => config.id === appId
    );

    const APP_CONFIG_PROPS = ['id', 'name', 'baseUrl', 'privateKey', 'signingSecret'];

    if (!appConfig) {
      throw new Error(`App config for app ID: ${appId} not found.`);
    } else if (!isEqual(Object.keys(appConfig).sort(), APP_CONFIG_PROPS.sort())) {
      throw new Error(
        `Invalid app config for: ${appId}. Please verify the config has: ${APP_CONFIG_PROPS.join(
          ', '
        )}`
      );
    }

    req.appConfig = appConfig;
  } catch (e) {
    console.error(e);
    return next(e);
  }

  next();
};

declare module 'http' {
  interface IncomingMessage {
    appConfig?: AppConfiguration;
  }
}
