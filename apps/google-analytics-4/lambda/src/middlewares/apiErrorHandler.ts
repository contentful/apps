import { ErrorRequestHandler } from 'express';
import { isApiError, ApiError } from '../errors/apiError';
import { InvalidSignature } from '../errors/invalidSignature';
import { UnableToVerifyRequest } from '../errors/unableToVerifyRequest';
import { GoogleApiError, GoogleApiClientError, GoogleApiServerError } from '../services/google-api';
import {
  MissingServiceAccountKeyHeader,
  InvalidServiceAccountKey,
} from './serviceAccountKeyProvider';

// Very intentional use of any in the type below. we're allowing the error map to define callbacks
// that can except an argument of _any_ type, for the purposes of the map. The callbacks themselves
// will still need to be internally type safe! This just allows us to add attributes to this map
// without getting stuck on a type incompatibility error. (FWIW unknown is considered an
// incompatbile assignment)
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export type ApiErrorMap = Record<string, (e: any) => ApiError<Record<string, unknown>>>;

export const apiErrorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (error) {
    if (isApiError(error)) {
      response.status(error.status).send({ errors: error.toJSON() });
    } else {
      response.status(500).send({
        errors: { errorType: 'ServerError', message: 'Internal Server Error', details: null },
      });
    }
  }

  next();
};

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

export const apiErrorMapper = (errorMap: ApiErrorMap = apiErrorMap): ErrorRequestHandler => {
  return (error, _request, _response, next) => {
    if (error) {
      const errorName = error.constructor.name as keyof typeof errorMap;
      if (errorName in errorMap) {
        console.error(error);
        return next(errorMap[errorName](error));
      }
      return next(error);
    }
    next();
  };
};
