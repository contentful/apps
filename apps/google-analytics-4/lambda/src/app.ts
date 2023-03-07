import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import Middleware from './middlewares';
import { ApiRouter, HealthRouter } from './routers';
import { corsConfig } from './middlewares/corsConfig';
import { config } from '@/../shared/config';

const app = express();
const apiRouteConstraint = ['/api/*'];

// Initialize Sentry as early as possible
Sentry.init({
  dsn: config.sentryDSN,
  environment: config.environment,
  release: config.release,
});

app.use(Middleware.setSentryContext);

// IMPORTANT: The Sentry request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

// enable CORS on /api/* routes
app.use(apiRouteConstraint, cors(corsConfig));

// verify signed requests on /api/* routes
app.use(apiRouteConstraint, Middleware.verifiySignedRequests);
app.use(apiRouteConstraint, Middleware.serviceAccountKeyProvider);

// serve static files for sample data
app.use(express.static('public'));

app.use('/health', HealthRouter);
app.use('/api', ApiRouter);

// IMPORTANT: do our custom error mapping before the Sentry error handler
app.use(Middleware.apiErrorMapper);

// IMPORTANT: The Sentry error handler must be before any other error middleware and after all controllers
app.use(Middleware.sentryErrorHandler);

// catch and handle errors
app.use(Middleware.apiErrorHandler);

export default app;
