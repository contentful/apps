import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';
import Middleware from './middlewares';
import { corsConfig } from './middlewares/corsConfig';
import { config } from './config';
import RateLimit from 'express-rate-limit';
import { sapRouter } from './routers';

const app = express();
app.use(express.json());
const apiRouteConstraint = ['/sap/*'];

// Initialize Sentry as early as possible
Sentry.init({
  dsn: config.sentryDSN,
  environment: config.environment,
  release: config.release,
});

app.use(Middleware.setSentryContext);

// IMPORTANT: The Sentry request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

// enable CORS on /sap/* routes
app.use(apiRouteConstraint, cors(corsConfig)); // enable CORS on /api/* routes

// set up rate limiter: maximum of five requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per windowMs
});
// apply rate limiter to all requests
app.use(limiter);

// TODO: mount headers before verify
app.use(apiRouteConstraint, Middleware.loadAppConfig); // load app config on /api/* routes
app.use(apiRouteConstraint, Middleware.verifiySignedRequests); // verify signed requests on /api/* routes
app.use(apiRouteConstraint, Middleware.getAppInstallationParameters); // get app installation parameters on /api/* routes

app.use('/sap', sapRouter);

app.use(Middleware.sentryErrorHandler);

export default app;
