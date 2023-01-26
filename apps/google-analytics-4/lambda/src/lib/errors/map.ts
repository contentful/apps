import { Status } from 'google-gax';
import { HttpCodeToRpcCodeMap } from 'google-gax/build/src/status';
import {
  GoogleApiClientError,
  GoogleApiError,
  GoogleApiServerError,
} from '../../services/google-api';
import { ApiError } from './api-error';
import { ApiErrorMap } from './api-error-mapper';

const httpStatusFromGoogleRpcStatus = (
  status: Status | undefined,
  fallbackStatus = 500
): number => {
  if (status === undefined) {
    return fallbackStatus;
  }
  for (const [httpStatus, googleStatus] of HttpCodeToRpcCodeMap) {
    if (googleStatus === status) {
      return httpStatus;
    }
  }
  return fallbackStatus;
};

export const apiErrorMap: ApiErrorMap = {
  GoogleApiError: (e: GoogleApiError) => new ApiError(e.message, e.name, 500),
  // GoogleApiClientError: (e: GoogleApiClientError) => new ApiError(e.details, e.name, httpStatusFromGoogleRpcStatus(e.code as unknown as Status, 400)),
  // GoogleApiServerError: (e: GoogleApiServerError) => new ApiError(e.name, e.details, httpStatusFromGoogleRpcStatus(e.code as unknown as Status))
};
