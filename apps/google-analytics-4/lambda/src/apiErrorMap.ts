import { ApiError } from './errors/apiError';
import { InvalidSignature } from './errors/invalidSignature';
import { UnableToVerifyRequest } from './errors/unableToVerifyRequest';
import { ApiErrorMap } from './middlewares/apiErrorHandler';
import {
  InvalidServiceAccountKey,
  MissingServiceAccountKeyHeader,
} from './middlewares/serviceAccountKeyProvider';
import { GoogleApiError } from './services/googleApiUtils';

export const apiErrorMap: ApiErrorMap = {
  GoogleApiError: (e: GoogleApiError) => new ApiError(e.details, e.errorType, e.status),
  MissingServiceAccountKeyHeader: (e: MissingServiceAccountKeyHeader) =>
    new ApiError(e.message, 'MissingServiceAccountKeyHeader', 400),
  InvalidServiceAccountKey: (e: InvalidServiceAccountKey) =>
    new ApiError(e.message, 'InvalidServiceAccountKey', 400),
  InvalidSignature: (e: InvalidSignature) =>
    new ApiError(e.message, 'InvalidSignature', 403, undefined, e),
  UnableToVerifyRequest: (e: UnableToVerifyRequest) =>
    new ApiError(e.message, 'UnableToVerifyRequest', 422, undefined, e),
};
