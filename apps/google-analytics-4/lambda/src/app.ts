import express from 'express';
import { ApiError } from './lib/errors/api-error';
import { apiErrorHandler, ApiErrorMap, apiErrorMapper } from './lib/errors/middleware';
import {
  GoogleApi,
  GoogleApiClientError,
  GoogleApiError,
  GoogleApiServerError,
} from './services/google-api';
import { ServiceAccountKeyFile } from './types';
const app = express();

// Maps an error class name -> a handler function that takes the error of that type as input and returns
// a correctly configured API error as output.
const errorClassToApiErrorMap: ApiErrorMap = {
  GoogleApiError: (e: GoogleApiError) => new ApiError(e.details, e.name, e.httpStatus),
  GoogleApiClientError: (e: GoogleApiClientError) => new ApiError(e.details, e.name, e.httpStatus),
  GoogleApiServerError: (e: GoogleApiServerError) => new ApiError(e.details, e.name, e.httpStatus),
};

app.get('/health', function (_req, res) {
  res.status(204).send();
});

app.get('/api/credentials', (_req, res) => {
  res.status(200).json({ status: 'active' });
});

app.get('/api/account_summaries', async (_req, res) => {
  const serviceAccountKeyFile = getServiceAccountKeyFile();
  const googleApi = GoogleApi.fromServiceAccountKeyFile(serviceAccountKeyFile);
  const result = await googleApi.listAccountSummaries();
  res.status(200).json(result);
});

app.use(apiErrorMapper(errorClassToApiErrorMap));
app.use(apiErrorHandler);

// TODO: Get the actual service account key file when request verification is introduced
function getServiceAccountKeyFile(): ServiceAccountKeyFile {
  return {
    type: 'service_account',
    project_id: 'dummy',
    private_key_id: 'dummy',
    private_key: 'dummy',
    client_email: 'dummy@example.com',
    client_id: 'dummy',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509',
  };
}

export default app;
