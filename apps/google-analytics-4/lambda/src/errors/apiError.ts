// TODO: more comprehensive recognization of known failures (ie. Stale/bad account data, lambda unavailable, transient, non-transient errors, timeouts)
// NOTE: This needs to be in sync with the frontend client - ie copy and pasted
export const ERROR_TYPE_MAP = {
  unknown: 'Unknown',
  unexpected: 'Unexpected',
  failedFetch: 'FailedFetch',
  malformedApiResponse: 'MalformedApiResponse',
  invalidJson: 'InvalidJson',
  disabledAdminApi: 'DisabledAdminApi',
  disabledDataApi: 'DisabledDataApi',
  noAccountsOrPropertiesFound: 'NoAccountsOrPropertiesFound',
  invalidServiceAccount: 'InvalidServiceAccount',
};

export class ApiError<T extends Record<string, unknown>> extends Error {
  errorType: string;
  status: number;
  details?: T;

  constructor(message: string, errorType: string, status: number, details?: T) {
    super(message);
    this.errorType = errorType;
    this.status = status;
    this.details = details;
  }

  toString() {
    return JSON.stringify({
      message: this.message,
      errorType: this.errorType,
      status: this.status,
      details: this.details,
    });
  }

  toJSON() {
    return {
      message: this.message,
      errorType: this.errorType,
      status: this.status,
      details: this.details || null,
    };
  }
}

export const isApiError = <T extends Record<string, unknown>>(e: Error): e is ApiError<T> => {
  if (!('errorType' in e)) {
    return false;
  }

  if (typeof e.errorType !== 'string') {
    return false;
  }

  if (!('status' in e)) {
    return false;
  }

  if (typeof e.status !== 'number') {
    return false;
  }

  return true;
};
