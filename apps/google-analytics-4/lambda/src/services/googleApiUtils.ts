import { ERROR_TYPE_MAP } from '../errors/apiError';
import { Status } from 'google-gax';
import { HttpCodeToRpcCodeMap } from 'google-gax/build/src/status';

// our own interface to match the shape of a GoogleError, since
// the interface Google provides does not actually match their
// run time error objects!
interface GoogleErrorType {
  message: string;
  code: Status;
  details: string;
}

interface GoogleApiErrorAdditionalParams {
  details: string;
  status: number;
  errorType: string;
}

export class GoogleApiError extends Error {
  details: string;
  status: number;
  errorType: string;

  constructor(
    message: ConstructorParameters<typeof Error>[0],
    options: ConstructorParameters<typeof Error>[1],
    additionalParams: GoogleApiErrorAdditionalParams
  ) {
    super(message, options);
    this.errorType = additionalParams.errorType;
    this.details = additionalParams.details;
    this.status = additionalParams.status;
  }
}

const httpStatusFromGoogleRpcStatus = (status: Status, fallbackStatus = 500): number => {
  for (const [httpStatus, googleStatus] of HttpCodeToRpcCodeMap) {
    if (googleStatus === status) {
      return httpStatus;
    }
  }
  return fallbackStatus;
};

export function createThrowableErrorFromCommonErrors(e: GoogleErrorType) {
  if (e.code === Status.INVALID_ARGUMENT) {
    return new GoogleApiError(
      e.message,
      { cause: e },
      {
        details: e.message,
        status: httpStatusFromGoogleRpcStatus(e.code),
        errorType: ERROR_TYPE_MAP.invalidProperty,
      }
    );
  } else if (e.code === Status.UNAUTHENTICATED) {
    return new GoogleApiError(
      e.message,
      { cause: e },
      {
        details: e.message,
        status: httpStatusFromGoogleRpcStatus(e.code),
        errorType: ERROR_TYPE_MAP.invalidServiceAccount,
      }
    );
  } else {
    return new GoogleApiError(
      e.message,
      { cause: e },
      {
        details: e.message,
        status: httpStatusFromGoogleRpcStatus(e.code),
        errorType: ERROR_TYPE_MAP.unknown,
      }
    );
  }
}

export function handleGoogleAdminApiError(e: GoogleErrorType): never {
  if (e.code === Status.PERMISSION_DENIED) {
    throw new GoogleApiError(
      e.message,
      { cause: e },
      {
        details: e.message,
        status: httpStatusFromGoogleRpcStatus(e.code),
        errorType: ERROR_TYPE_MAP.disabledAdminApi,
      }
    );
  } else {
    const throwableError = createThrowableErrorFromCommonErrors(e);
    throw throwableError;
  }
}

export function handleGoogleDataApiError(e: GoogleErrorType): never {
  // TODO: Find a way to have tighter distinguishing conditions.
  // Example: The PERMISSION_DENIED error is overloaded by two known actions
  //          1. data api disabled
  //          2. data api enabled but user does not have permissions to the property
  //          Both give the PERMISSION_DENIED status from google - this means we need an additional measure to distinguish these scenarios
  if (e.code === Status.PERMISSION_DENIED) {
    throw new GoogleApiError(
      e.message,
      { cause: e },
      {
        details: e.message,
        status: httpStatusFromGoogleRpcStatus(e.code),
        errorType: ERROR_TYPE_MAP.disabledDataApi,
      }
    );
  } else {
    const throwableError = createThrowableErrorFromCommonErrors(e);
    throw throwableError;
  }
}

// parses the runtime error objects thrown directly by the Google API
// into a type we can work with predicatably
export function isGoogleError(e: unknown): e is GoogleErrorType {
  // for typescript, make sure e is really some kind of object and not null
  if (typeof e !== 'object' || !e) {
    return false;
  }
  if (!('code' in e)) {
    return false;
  }

  if (!Object.values(Status).includes(e.code as Status)) {
    return false;
  }

  if (!('details' in e)) {
    return false;
  }

  if (typeof e.details !== 'string') {
    return false;
  }

  return true;
}
