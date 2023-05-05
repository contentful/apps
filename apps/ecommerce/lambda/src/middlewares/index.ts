import * as Sentry from '@sentry/node';
import { verifySignedRequestMiddleware } from './verifySignedRequests';
import { setSentryContext } from './setSentryContext';
import { NextFunction, Request, Response } from 'express';

const Middleware = {
  setSentryContext: setSentryContext,
  verifiySignedRequests: verifySignedRequestMiddleware,
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
