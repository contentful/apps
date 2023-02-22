import * as dotenv from 'dotenv';
import express from 'express';
import { ApiError } from './lib/errors/api-error';
import { apiErrorHandler, ApiErrorMap, apiErrorMapper } from './lib/errors/middlewares';
import {
  GoogleApi,
  GoogleApiClientError,
  GoogleApiError,
  GoogleApiServerError,
} from './services/google-api';
import { verifySignedRequestMiddleware } from './lib/verify-signed-request-middleware';
import { InvalidSignature } from './lib/errors/invalid-signature';
import { UnableToVerifyRequest } from './lib/errors/unable-to-verify-request';
import {
  InvalidServiceAccountKey,
  MissingServiceAccountKeyHeader,
  serviceAccountKeyProvider,
} from './middlewares/service-account-key-provider';

dotenv.config(); // TODO: load env vars from .env.local

const app = express();

// allow all OPTIONS requests
app.options('/*', function (_req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    [
      'Authorization',
      'X-Contentful-Timestamp',
      'X-Contentful-Signed-Headers',
      'X-Contentful-Signature',
      'X-Contentful-User-ID',
      'X-Contentful-Space-ID',
      'X-Contentful-Environment-ID',
      'X-Contentful-App-ID',
      'x-contentful-serviceaccountkeyid',
      'x-contentful-serviceaccountkey',
    ].join(', ')
  );
  res.send(200);
});

// validate signed requests
app.use(['/api/credentials', '/api/account_summaries'], verifySignedRequestMiddleware);
app.use(['/api/credentials', '/api/account_summaries'], serviceAccountKeyProvider);

// serve static files for sample data
app.use(express.static('public'));

// Maps an error class name -> a handler function that takes the error of that type as input and returns
// a correctly configured API error as output.
const errorClassToApiErrorMap: ApiErrorMap = {
  GoogleApiError: (e: GoogleApiError) => new ApiError(e.details, e.name, e.httpStatus),
  GoogleApiClientError: (e: GoogleApiClientError) => new ApiError(e.details, e.name, e.httpStatus),
  GoogleApiServerError: (e: GoogleApiServerError) => new ApiError(e.details, e.name, e.httpStatus),
  InvalidSignature: (e: InvalidSignature) => new ApiError(e.message, e.name, 403),
  UnableToVerifyRequest: (e: UnableToVerifyRequest) => new ApiError(e.message, e.name, 422),
  MissingServiceAccountKeyHeader: (e: MissingServiceAccountKeyHeader) =>
    new ApiError(e.message, e.name, 400),
  InvalidServiceAccountKey: (e: InvalidServiceAccountKey) => new ApiError(e.message, e.name, 400),
};

app.get('/health', function (_req, res) {
  res.status(204).send();
});

app.get('/api/credentials', (_req, res) => {
  console.log('headers', _req.headers);
  res.status(200).json({ status: 'active' });
});

app.get('/api/account_summaries', async (req, res, next) => {
  try {
    const serviceAccountKeyFile = req.serviceAccountKey;

    if (serviceAccountKeyFile === undefined) {
      // intentional runtime error because the middleware already handles this. typescript
      // just doesn't realize
      throw new Error('missing service account key value');
    }

    const googleApi = GoogleApi.fromServiceAccountKeyFile(serviceAccountKeyFile);
    const result = await googleApi.listAccountSummaries();
    res.status(200).json(result);
  } catch (err) {
    // pass to apiErrorHandler
    next(err);
  }
});

// catch and handle errors
app.use(apiErrorMapper(errorClassToApiErrorMap));
app.use(apiErrorHandler);

export default app;
