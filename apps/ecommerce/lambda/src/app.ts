import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import Middleware from './middlewares';
import { ApiRouter, MagentoRouter, ShopifyRouter } from './routers';
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

app.use(apiRouteConstraint, cors(corsConfig)); // enable CORS on /api/* routes
app.use(apiRouteConstraint, Middleware.loadAppConfig); // load app config on /api/* routes
app.use(apiRouteConstraint, Middleware.verifiySignedRequests); // verify signed requests on /api/* routes
app.use(apiRouteConstraint, Middleware.getAppInstallationParameters); // get app installation parameters on /api/* routes

// serve static files for sample data
app.use(express.static('public'));

app.use('/api', ApiRouter);

app.use('/shopify', ShopifyRouter);
app.use('/magento', MagentoRouter);

// IMPORTANT: The Sentry error handler must be after all controllers but before any other error handling middleware (with exception of our apiErrorMapper)
app.use(Middleware.sentryErrorHandler);

// return JSON error responses
app.use(Middleware.errorHandler);

export default app;
