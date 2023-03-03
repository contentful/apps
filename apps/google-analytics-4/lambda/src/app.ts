import express from 'express';
import cors from 'cors';
import { apiErrorMap } from './apiErrorMap';
import Middleware from './middlewares';
import { ApiRouter, HealthRouter } from './routers';
import { corsConfig } from './middlewares/corsConfig';

const app = express();
const apiRouteConstraint = ['/api/*'];

// enable CORS on /api/* routes
app.use(apiRouteConstraint, cors(corsConfig));

// verify signed requests on /api/* routes
app.use(apiRouteConstraint, Middleware.verifiySignedRequests);
app.use(apiRouteConstraint, Middleware.serviceAccountKeyProvider);

// serve static files for sample data
app.use(express.static('public'));

app.use('/health', HealthRouter);
app.use('/api', ApiRouter);

// catch and handle errors
app.use(Middleware.apiErrorMapper(apiErrorMap));
app.use(Middleware.apiErrorHandler);

export default app;
