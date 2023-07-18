import Ajv from 'ajv';
import { RequestHandler } from 'express';
import { UnprocessableEntityException } from './errors';

const ajv = new Ajv({
  // Enable strict mode
  strict: true,
  // Collects all schema errors instead of throwing on the first one.
  allErrors: true,
  // Include references in errors. Needed for AJV to Contentful error conversion.
  verbose: true,
});

// Express does not handle async requests natively and may throw unhandled promise exceptions.
// This allows any handler to be async
export const asyncHandler =
  (
    handler: (...params: Parameters<RequestHandler>) => Promise<ReturnType<RequestHandler>>
  ): RequestHandler =>
  (request, response, next) => {
    return handler(request, response, next).catch(next);
  };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertValid = <T>(schema: { [key: string]: any }, data: unknown): T => {
  const valid = ajv.validate(
    {
      ...schema,
      // Use fixed version of JSON Schema standard.
      // https://json-schema.org/understanding-json-schema/reference/schema.html
      $schema: 'http://json-schema.org/draft-07/schema#',
    },
    data
  );

  if (!valid) {
    if (ajv.errors) throw new UnprocessableEntityException({ error: ajv.errors });
    throw new UnprocessableEntityException({ errMessage: 'Invalid entity' });
  }

  return data as T;
};
