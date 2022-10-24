import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { Handler, Request, Response } from 'express';

export const sendError = (
  status: StatusCodes,
  { response, details }: { details?: string; response: Response }
) => {
  response.status(status).send({ error: getReasonPhrase(status), ...(details ? { details } : {}) });
};

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
export const runMiddleware = (req: Request, res: Response, fn: Handler) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
};
