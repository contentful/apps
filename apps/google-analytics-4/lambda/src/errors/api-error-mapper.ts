import { ErrorRequestHandler } from 'express';
import { ApiError } from './api-error';
import { GoogleApiError, GoogleApiClientError, GoogleApiServerError } from '../services/google-api';

const apiErrorMap = {
  GoogleApiError: (e: GoogleApiError) => new ApiError(e.details || '', e.name, 500, e),
  GoogleApiClientError: (e: GoogleApiClientError) => new ApiError(e.details || '', e.name, 400, e),
  GoogleApiServerError: (e: GoogleApiServerError) => new ApiError(e.details || '', e.name, 500, e),
};

type ApiErrorMap = Record<string, (e: Error) => ApiError>;

export const apiErrorMapper = (errorMap: ApiErrorMap): ErrorRequestHandler => {
  return (error, _request, _response, next) => {
    if (error) {
      const errorName = error.constructor.name as keyof typeof errorMap;
      if (errorName in errorMap) {
        return next(errorMap[errorName](error));
      }
      return next(error);
    }
    next();
  };
};

export const apiErrorMapper2: ErrorRequestHandler = (error, _request, _response, next) => {
  if (error) {
    const errorName = error.constructor.name as keyof typeof apiErrorMap;
    if (errorName in apiErrorMap) {
      return next(apiErrorMap[errorName](error));
    }
    return next(error);
  }
  next();
};
