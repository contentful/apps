import { AnalyticsAdminServiceClient, protos } from '@google-analytics/admin';
import { GoogleAuthOptions } from 'google-auth-library';
import { ServiceAccountKeyFile, ReportRowType } from '../types';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import {
  isGoogleError,
  handleGoogleDataApiError,
  handleGoogleAdminApiError,
} from './googleApiUtils';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
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

  formatDate = (dateValue: Date) => dateValue.toISOString().slice(0, 10).split('-').join('');

  deriveDate = (dateValue: string) =>
    new Date(
      `${dateValue.substring(0, 4)}-${dateValue.substring(4, 6)}-${dateValue.substring(6, 8)}`
    );

  mapDates = (startDate: string, endDate: string) => {
    const dates = [];
    const date = new Date(new Date(startDate).setUTCHours(0, 0, 0, 0));
    const end = new Date(new Date(endDate).setUTCHours(0, 0, 0, 0));

    while (date <= end) {
      dates.push(new Date(date));
      date.setUTCDate(date.getUTCDate() + 1);
    }

    return dates;
  };

  supplementDates = (rows: ReportRowType[], _startDate?: string, _endDate?: string) => {
    const supplementedReportRows = [] as ReportRowType[];

    const startDate = _startDate || this.formatDate(new Date(Date.now() - ONE_WEEK));
    const endDate = _endDate || this.formatDate(new Date(Date.now()));

    this.mapDates(startDate, endDate).forEach((date) => {
      const foundRow = rows.find(
        (row) => this.deriveDate(row.dimensionValues[0].value).getUTCDate() == date.getUTCDate()
      );

      if (foundRow) {
        supplementedReportRows.push({
          metricValues: foundRow.metricValues,
          dimensionValues: foundRow.dimensionValues,
        });
      } else {
        supplementedReportRows.push({
          metricValues: [{ value: '0', oneValue: 'value' }],
          dimensionValues: [{ value: this.formatDate(date), oneValue: 'value' }],
        });
      }
    });

    return supplementedReportRows;
  };

  async runReport(
    property: string,
    slug: string,
    startDate?: string,
    endDate?: string,
    dimensions?: string[],
    metrics?: string[]
  ) {
    const DEFAULT_DIMENSIONS = ['date'];
    const DEFAULT_METRICS = ['screenPageViews', 'totalUsers', 'screenPageViewsPerUser'];
    const DEFAULT_START_DATE = new Date(Date.now() - ONE_WEEK).toISOString();

    try {
      const [response] = await this.betaAnalyticsDataClient.runReport({
        property,
        dateRanges: [
          {
            startDate: startDate ?? DEFAULT_START_DATE.split('T')[0], // extracts YYYY-MM-DD from ISO string
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
        keepEmptyRows: true,
        orderBys: [
          {
            desc: false,
            dimension: {
              dimensionName: 'date',
              orderType: 'NUMERIC',
            },
          },
        ],
      });

      return {
        ...response,
        ...{ rows: this.supplementDates(response.rows as ReportRowType[], startDate, endDate) },
      };
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
