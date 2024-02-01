import { ApiErrorObject } from './types';

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
