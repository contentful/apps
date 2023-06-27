import * as Sentry from '@sentry/node';
import { NextFunction, Request, Response } from 'express';
import { setSentryContext } from './setSentryContext';
import { loadAppConfigMiddleware } from './loadAppConfig';
import { getAppInstallationParametersMiddleware } from './getAppInstallationParameters';
import { verifySignedRequestMiddleware } from './verifySignedRequests';

const Middleware = {
  setSentryContext: setSentryContext,
  loadAppConfig: loadAppConfigMiddleware,
  verifiySignedRequests: verifySignedRequestMiddleware,
  getAppInstallationParameters: getAppInstallationParametersMiddleware,
  sentryErrorHandler: Sentry.Handlers.errorHandler({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shouldHandleError(error) {
      return true;
    },
  }),
  errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => {
    if (error) {
      res.status(500).send({ status: 'error', message: error.message });
    }

    next();
  },
};

export default Middleware;
