import { AnalyticsAdminServiceClient, protos } from '@google-analytics/admin';
import { GoogleAuthOptions } from 'google-auth-library';
import { ServiceAccountKeyFile } from '../types';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import {
  isGoogleError,
  handleGoogleDataApiError,
  handleGoogleAdminApiError,
} from './googleApiUtils';

export class GoogleApiService {
  readonly serviceAccountKeyFile: ServiceAccountKeyFile;
  readonly analyticsAdminServiceClient: AnalyticsAdminServiceClient;
  readonly betaAnalyticsDataClient: BetaAnalyticsDataClient;

  static fromServiceAccountKeyFile(serviceAccountKeyFile: ServiceAccountKeyFile): GoogleApiService {
    const analyticsAdminServiceClient = new AnalyticsAdminServiceClient({
      credentials: makeCredentials(serviceAccountKeyFile),
      projectId: serviceAccountKeyFile.project_id,
    });
    const betaAnalyticsDataClient = new BetaAnalyticsDataClient({
      credentials: makeCredentials(serviceAccountKeyFile),
      projectId: serviceAccountKeyFile.project_id,
    });
    return new GoogleApiService(
      serviceAccountKeyFile,
      analyticsAdminServiceClient,
      betaAnalyticsDataClient
    );
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

  async runReport(
    property: string,
    slug: string,
    startDate?: string,
    endDate?: string,
    dimensions?: string[],
    metrics?: string[]
  ) {
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const DEFAULT_DIMENSIONS = ['date'];
    const DEFAULT_METRICS = ['screenPageViews', 'totalUsers', 'screenPageViewsPerUser'];

    try {
      const [response] = await this.betaAnalyticsDataClient.runReport({
        property: property,
        dateRanges: [
          {
            startDate: startDate ?? new Date(Date.now() - ONE_WEEK).toISOString().split('T')[0], // extracts YYYY-MM-DD from ISO string
            endDate: endDate ?? 'today',
          },
        ],
        dimensions: (dimensions || DEFAULT_DIMENSIONS).map((dimension) => {
          return { name: dimension };
        }),
        metrics: (metrics || DEFAULT_METRICS).map((metric) => {
          return { name: metric };
        }),
        dimensionFilter: {
          filter: {
            fieldName: 'unifiedPagePathScreen',
            stringFilter: {
              value: slug,
            },
          },
        },
      });

      return response;
    } catch (e: any) {
      if (isGoogleError(e)) handleGoogleDataApiError(e);
      else {
        throw e;
      }
    }
  }

  private async fetchAccountSummaries() {
    try {
      return await this.analyticsAdminServiceClient.listAccountSummaries();
    } catch (e: any) {
      if (isGoogleError(e)) handleGoogleAdminApiError(e);
      else throw e;
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
