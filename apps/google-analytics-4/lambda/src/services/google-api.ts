import { AnalyticsAdminServiceClient, protos } from '@google-analytics/admin';
import { GoogleAuthOptions } from 'google-auth-library';
import { Status } from 'google-gax';
import { HttpCodeToRpcCodeMap } from 'google-gax/build/src/status';
import { ServiceAccountKeyFile } from '../types';

interface GoogleApiErrorParams {
  code: Status;
  details: string;
  httpStatus: number;
}

export class GoogleApiError extends Error {
  code: Status;
  details: string;
  httpStatus: number;

  constructor(
    message: ConstructorParameters<typeof Error>[0],
    options: ConstructorParameters<typeof Error>[1],
    errorParams: GoogleApiErrorParams
  ) {
    super(message, options);
    this.code = errorParams.code;
    this.details = errorParams.details;
    this.httpStatus = errorParams.httpStatus;
  }
}
export class GoogleApiServerError extends GoogleApiError {}
export class GoogleApiClientError extends GoogleApiError {}

const clientErrorStatuses = [
  Status.INVALID_ARGUMENT,
  Status.UNAUTHENTICATED,
  Status.PERMISSION_DENIED,
  Status.NOT_FOUND,
  Status.ABORTED,
  Status.OUT_OF_RANGE,
  Status.RESOURCE_EXHAUSTED,
  Status.CANCELLED,
  Status.FAILED_PRECONDITION,
];

// our own interface to match the shape of a GoogleError, since
// the interface Google provides does not actually match their
// run time error objects!
interface GoogleError {
  name: string;
  message: string;
  code: Status;
  details: string;
}

const httpStatusFromGoogleRpcStatus = (status: Status, fallbackStatus = 500): number => {
  for (const [httpStatus, googleStatus] of HttpCodeToRpcCodeMap) {
    if (googleStatus === status) {
      return httpStatus;
    }
  }
  return fallbackStatus;
};

export function throwGoogleApiError(e: Error): never {
  if (!isGoogleError(e)) {
    throw new GoogleApiError(
      e.message,
      { cause: e },
      {
        code: Status.UNKNOWN,
        details: e.message,
        httpStatus: 500, // we don't know what happened so we'll assume it's a server error
      }
    );
  }

  if (clientErrorStatuses.includes(e.code)) {
    throw new GoogleApiClientError(
      e.message,
      { cause: e },
      {
        code: e.code,
        details: e.details,
        httpStatus: httpStatusFromGoogleRpcStatus(e.code),
      }
    );
  } else {
    // we'll assume that any GoogleErrors (with a code) that aren't client errors
    // are server errors of some kind ¯\_(ツ)_/¯
    throw new GoogleApiServerError(
      e.message,
      { cause: e },
      {
        code: e.code,
        details: e.details,
        httpStatus: httpStatusFromGoogleRpcStatus(e.code),
      }
    );
  }
}

// parses the runtime error objects thrown directly by the Google API
// into a type we can work with predicatably
function isGoogleError(e: Error): e is GoogleError {
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

export class GoogleApi {
  readonly serviceAccountKeyFile: ServiceAccountKeyFile;
  readonly analyticsAdminServiceClient: AnalyticsAdminServiceClient;

  static fromServiceAccountKeyFile(serviceAccountKeyFile: ServiceAccountKeyFile): GoogleApi {
    const analyticsAdminServiceClient = new AnalyticsAdminServiceClient({
      credentials: makeCredentials(serviceAccountKeyFile),
      projectId: serviceAccountKeyFile.project_id,
    });
    return new GoogleApi(serviceAccountKeyFile, analyticsAdminServiceClient);
  }

  constructor(
    serviceAccountKeyFile: ServiceAccountKeyFile,
    analyticsAdminServiceClient: AnalyticsAdminServiceClient
  ) {
    this.serviceAccountKeyFile = serviceAccountKeyFile;
    this.analyticsAdminServiceClient = analyticsAdminServiceClient;
  }

  async listAccountSummaries(): Promise<protos.google.analytics.admin.v1alpha.IAccountSummary[]> {
    const [accountSummaries] = await this.fetchAccountSummaries();
    return accountSummaries;
  }

  async listAccounts(): Promise<any> {
    return await this.fetchAccounts();
  }

  private async fetchAccountSummaries() {
    try {
      return await this.analyticsAdminServiceClient.listAccountSummaries();
    } catch (e) {
      if (e instanceof Error) {
        throwGoogleApiError(e);
      }
      throw e;
    }
  }
  
  private async fetchAccounts() {
    try {
      return await this.analyticsAdminServiceClient.listAccounts();
    } catch (e) {
      if (e instanceof Error) {
        throwGoogleApiError(e);
      }
      throw e;
    }
  }
}

function makeCredentials(
  serviceAccountKeyFile: ServiceAccountKeyFile
): GoogleAuthOptions['credentials'] {
  return {
    client_email: serviceAccountKeyFile.client_email,
    private_key: serviceAccountKeyFile.private_key,
  };
}
