import express from 'express';
import { apiErrorMap } from './apiErrorMap';
import Middleware from './middlewares';
import { ApiRouter, HealthRouter } from './routers';

const app = express();

// allow all OPTIONS requests
app.options('/*', Middleware.allowCorsOptionsRequests); // TOOD: replace with `cors` library

// verify signed requests on /api/* routes
const apiRouteConstraint = ['/api/*'];
app.use(apiRouteConstraint, Middleware.verifiySignedRequests);
app.use(apiRouteConstraint, Middleware.serviceAccountKeyProvider);

// serve static files for sample data
app.use(express.static('public'));

app.use('/health', HealthRouter);
app.use('/api', ApiRouter)

// catch and handle errors
app.use(Middleware.apiErrorMapper(apiErrorMap));
app.use(Middleware.apiErrorHandler);

export default app;
