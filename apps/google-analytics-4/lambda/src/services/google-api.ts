import { AnalyticsAdminServiceClient, protos } from '@google-analytics/admin';
import { GoogleAuthOptions } from 'google-auth-library';
import { ServiceAccountKeyFile } from '../types';

export class GoogleApiError extends Error {}
export class GoogleApiServerError extends GoogleApiError {}
export class GoogleApiClientError extends GoogleApiError {}

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
        throw new GoogleApiServerError(e.message, { cause: e });
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
