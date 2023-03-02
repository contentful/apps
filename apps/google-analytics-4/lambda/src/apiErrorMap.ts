import { ApiError } from './errors/apiError';
import { InvalidSignature } from './errors/invalidSignature';
import { UnableToVerifyRequest } from './errors/unableToVerifyRequest';
import { ApiErrorMap } from './middlewares/apiErrorHandler';
import {
  InvalidServiceAccountKey,
  MissingServiceAccountKeyHeader,
} from './middlewares/serviceAccountKeyProvider';
import { GoogleApiClientError, GoogleApiError, GoogleApiServerError } from './services/google-api';

export const apiErrorMap: ApiErrorMap = {
  GoogleApiError: (e: GoogleApiError) => new ApiError(e.details, e.name, e.httpStatus),
  GoogleApiClientError: (e: GoogleApiClientError) => new ApiError(e.details, e.name, e.httpStatus),
  GoogleApiServerError: (e: GoogleApiServerError) => new ApiError(e.details, e.name, e.httpStatus),
  InvalidSignature: (e: InvalidSignature) => new ApiError(e.message, e.name, 403),
  UnableToVerifyRequest: (e: UnableToVerifyRequest) => new ApiError(e.message, e.name, 422),
  MissingServiceAccountKeyHeader: (e: MissingServiceAccountKeyHeader) =>
    new ApiError(e.message, e.name, 400),
  InvalidServiceAccountKey: (e: InvalidServiceAccountKey) => new ApiError(e.message, e.name, 400),
};
