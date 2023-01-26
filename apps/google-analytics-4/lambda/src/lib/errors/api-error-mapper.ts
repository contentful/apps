import { ErrorRequestHandler } from 'express';
import { ApiError } from './api-error';

// Very intentional use of any below. we're allowing the error map to define callbacks that can except
// an argument of _any_ type, for the purposes of the map. The callbacks themselves will still
// need to be internally type safe! This just allows us to add attributes to this map without getting
// stuck on a type incompatibility error. (FWIW unknown is considered an incompatbile assignment)
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export type ApiErrorMap = Record<string, (e: any) => ApiError<Record<string, unknown>>>;

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
