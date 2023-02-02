import { ErrorRequestHandler } from 'express';
import { isException } from './exception';

export const errorMiddleware: ErrorRequestHandler = (error, request, response, next) => {
  if (error) {
    // Very dumb logging
    console.log(JSON.stringify(error));

    if (isException(error)) {
      response.status(error.status).send(error.toJSON());
    } else {
      response.status(500).send({ status: 500, message: 'Internal Server Error' });
    }
  }
  next();
};
