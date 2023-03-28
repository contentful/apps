import { ErrorRequestHandler } from 'express';
import { isApiError, ApiError } from '../errors/apiError';

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
      console.error(error);
      response.status(error.status).send({ errors: error.toJSON() });
    } else {
      console.error(error);
      response.status(500).send({
        errors: {
          errorType: 'ServerError',
          message: 'Internal Server Error',
          details: null,
          status: 500,
        },
      });
    }
  }

  next();
};

export const apiErrorMapper = (errorMap: ApiErrorMap): ErrorRequestHandler => {
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
