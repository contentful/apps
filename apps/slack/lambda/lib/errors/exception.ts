export class Exception<T> extends Error {
  status: number;
  message: string;
  details?: T;
  isException: boolean;

  constructor(status: number, message: string, details?: T) {
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
