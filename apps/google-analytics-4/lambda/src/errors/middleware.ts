import { ErrorRequestHandler } from 'express';
import { isApiError } from './api-error';

export const errorMiddleware: ErrorRequestHandler = (error, _request, response, next) => {
  if (error) {
    console.log(JSON.stringify(error));

    if (isApiError(error)) {
      response.status(error.status).send(error.toJSON());
    } else {
      response
        .status(500)
        .send({ errorType: 'ServerError', message: 'Internal Server Error', details: {} });
    }
  }
  next();
};
