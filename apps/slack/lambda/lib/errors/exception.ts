import { ErrorObject } from 'ajv/dist/types';

// eslint-disable-next-line  @typescript-eslint/no-unused-vars
export class Exception<T> extends Error {
  status: number;
  message: string;
  details?: ExceptionDetails;
  isException: boolean;

  constructor(status: number, message: string, details?: ExceptionDetails) {
    super(message);
    this.status = status;
    this.message = message;
    this.details = details;
    this.isException = true;
  }

  toString() {
    return JSON.stringify({
      message: this.message,
      status: this.status,
      details: this.details,
    });
  }

  toJSON() {
    return {
      status: this.status,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export const isException = (e: unknown): e is Exception<unknown> =>
  typeof e == 'object' && !!e && 'isException' in e;

export type ExceptionDetails = {
  errMessage?: string;
  environmentId?: string;
  spaceId?: string;
  error?: ErrorObject[] | ErrorObject;
};
