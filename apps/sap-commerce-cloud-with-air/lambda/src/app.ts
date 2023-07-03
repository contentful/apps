import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import Middleware from './middlewares';
import { sapRouter } from './routers';
import { config } from './config';

const app = express();

// Initialize Sentry as early as possible
Sentry.init({
  dsn: config.sentryDSN,
  environment: config.environment,
  release: config.release,
});

// Express Middleware
app.use(cors(Middleware.corsConfig));
app.use(express.json());
app.disable('x-powered-by');

// Middleware
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler); // IMPORTANT: The Sentry request handler must be the first middleware on the app
app.use(Middleware.setSentryContext);
app.use(Middleware.loadAppConfig);
app.use(Middleware.verifiySignedRequests);
app.use(Middleware.getAppInstallationParameters);

// Routers
app.use('/sap', sapRouter);

export default app;
