import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import Middleware from './middlewares';
import { ApiRouter, ShopifyRouter } from './routers';
import { corsConfig } from './middlewares/corsConfig';
import { config } from './config';

const app = express();
app.use(express.json());
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
// to test endpoints with Postman, comment out below
app.use(apiRouteConstraint, Middleware.verifiySignedRequests);

// serve static files for sample data
app.use(express.static('public'));

app.use('/api', ApiRouter);

app.use('/shopify', ShopifyRouter);

// IMPORTANT: The Sentry error handler must be after all controllers but before any other error handling middleware (with exception of our apiErrorMapper)
app.use(Middleware.sentryErrorHandler);

// return JSON error responses
app.use(Middleware.errorHandler);

export default app;
