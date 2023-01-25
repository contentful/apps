import { AnalyticsAdminServiceClient, protos } from '@google-analytics/admin';
import { GoogleAuthOptions } from 'google-auth-library';
import { Status } from 'google-gax';
import { ServiceAccountKeyFile } from '../types';

export class GoogleApiError extends Error {
  code?: string;
  details?: string;
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

export function throwGoogleApiError(e: Error): never {
  let error: GoogleApiError;

  if (!isGoogleError(e)) {
    throw new GoogleApiError(e.message, { cause: e });
  }

  if (clientErrorStatuses.includes(e.code)) {
    error = new GoogleApiClientError(e.message, { cause: e });
  } else {
    // we'll assume that any GoogleErrors (with a code) that aren't client errors
    // are server errors of some kind
    error = new GoogleApiServerError(e.message, { cause: e });
  }

  error.code = Status[e.code];
  error.details = e.details;

  throw error;
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
}

function makeCredentials(
  serviceAccountKeyFile: ServiceAccountKeyFile
): GoogleAuthOptions['credentials'] {
  return {
    client_email: serviceAccountKeyFile.client_email,
    private_key: serviceAccountKeyFile.private_key,
  };
}
