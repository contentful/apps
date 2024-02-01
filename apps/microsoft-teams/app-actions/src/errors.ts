import { ApiErrorObject } from './types';

// this is a convenience class that allows us to just "throw" API error objects
// directly, allowing them to be seamlessly parsed in our error handler
export class ApiError extends Error {
  public readonly type: ApiErrorObject['type'];
  public readonly details: ApiErrorObject['details'];

  constructor(apiErrorObject: ApiErrorObject) {
    const { message, type, details } = apiErrorObject;
    super(message);
    this.type = type;
    this.details = details;
  }
}
