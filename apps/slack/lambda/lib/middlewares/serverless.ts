import { RequestHandler } from 'express';
import { ServerlessConfiguration } from '../config';

export function createServerlessMiddleware(config: ServerlessConfiguration): RequestHandler {
  return (req, _res, next) => {
    req.publicPath = `${config.pathPrefix}${req.path}`;
    next();
  };
}

declare module 'http' {
  interface IncomingMessage {
    publicPath: string;
  }
}
