export class MarketoAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketoAuthenticationError';
  }
}

export class MarketoApiError extends Error {
  constructor(
    message: string,
    public readonly details?: {
      statusCode: number;
      errors: Array<{ code: string; message: string }>;
    }
  ) {
    super(message);
    this.name = 'MarketoApiError';
  }
}
