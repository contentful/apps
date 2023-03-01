import { AnalyticsAdminServiceClient, protos } from '@google-analytics/admin';
import { GoogleAuthOptions } from 'google-auth-library';
import { Status } from 'google-gax';
import { HttpCodeToRpcCodeMap } from 'google-gax/build/src/status';
import { ServiceAccountKeyFile } from '../types';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

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
    errorParams: GoogleApiErrorParams,
    name: string,
  ) {
    super(message, options);
    this.name = name
    this.code = errorParams.code;
    this.details = errorParams.details;
    this.httpStatus = errorParams.httpStatus;
  }
}
export class GoogleApiServerError extends GoogleApiError { }
export class GoogleApiClientError extends GoogleApiError { }

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
export const GoogleErrorApiErrorTypes = {
  AdminAPI: "AdminApiError",
  DataAPI: "DataApiError"
}

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
      },
      e.name
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
      },
      e.name
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
      },
      e.name
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
  readonly betaAnalyticsDataClient: BetaAnalyticsDataClient;

  static fromServiceAccountKeyFile(serviceAccountKeyFile: ServiceAccountKeyFile): GoogleApi {
    const analyticsAdminServiceClient = new AnalyticsAdminServiceClient({
      credentials: makeCredentials(serviceAccountKeyFile),
      projectId: serviceAccountKeyFile.project_id,
    });
    const betaAnalyticsDataClient = new BetaAnalyticsDataClient({
      credentials: makeCredentials(serviceAccountKeyFile),
      projectId: serviceAccountKeyFile.project_id,
    });
    return new GoogleApi(serviceAccountKeyFile, analyticsAdminServiceClient, betaAnalyticsDataClient);
  }

  constructor(
    serviceAccountKeyFile: ServiceAccountKeyFile,
    analyticsAdminServiceClient: AnalyticsAdminServiceClient,
    betaAnalyticsDataClient: BetaAnalyticsDataClient
  ) {
    this.serviceAccountKeyFile = serviceAccountKeyFile;
    this.analyticsAdminServiceClient = analyticsAdminServiceClient;
    this.betaAnalyticsDataClient = betaAnalyticsDataClient;
  }

  async listAccountSummaries(): Promise<protos.google.analytics.admin.v1alpha.IAccountSummary[]> {
    const [accountSummaries] = await this.fetchAccountSummaries();
    return accountSummaries;
  }

  async runReport(property: string, slug: string, startDate?: string, endDate?: string, dimensions?: string[], metrics?: string[]) {
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const DEFAULT_DIMENSIONS = [
      'date',
    ]
    const DEFAULT_METRICS = [
      'screenPageViews',
      'totalUsers',
      'screenPageViewsPerUser',
    ]

    try {
      const [response] = await this.betaAnalyticsDataClient.runReport({
        property: property,
        dateRanges: [
          {
            startDate: startDate ?? (new Date(Date.now() - ONE_WEEK)).toISOString().split('T')[0],
            endDate: endDate ?? 'today',
          },
        ],
        dimensions: (dimensions || DEFAULT_DIMENSIONS).map((dimension) => { return { name: dimension } }),
        metrics: (metrics || DEFAULT_METRICS).map((metric) => { return { name: metric } }),
        dimensionFilter: {
          filter: {
            fieldName: 'unifiedPagePathScreen',
            stringFilter: {
              value: slug
            },
          }
        },
      });

      return response
    } catch (e) {
      if (e instanceof Error) {
        e.name = GoogleErrorApiErrorTypes.DataAPI;
        throwGoogleApiError(e);
      }
      throw e;
    }
  }

  private async fetchAccountSummaries() {
    try {
      return await this.analyticsAdminServiceClient.listAccountSummaries();
    } catch (e) {
      if (e instanceof Error) {
        e.name = GoogleErrorApiErrorTypes.AdminAPI;
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
