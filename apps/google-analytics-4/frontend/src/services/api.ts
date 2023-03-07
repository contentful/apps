import { config } from '../config';
import { PlainClientAPI } from 'contentful-management';
import { ServiceAccountKeyId, ServiceAccountKey } from '../types';
import { fetchFromApi } from 'apis/fetchApi';
import {
  Headers,
  ApiErrorType,
  Credentials,
  ZAccountSummaries,
  ZRunReportData,
  ZCredentials,
  AccountSummaries,
  RunReportData,
} from 'apis/apiTypes';
import { upperFirst } from 'lodash';

export class ApiError extends Error {
  details: string;
  status: number;
  errorType: string;

  constructor(res: ApiErrorType) {
    super(res.message);
    this.errorType = res.errorType;
    this.details = res.details;
    this.status = res.status;
  }
}

export class Api {
  readonly baseUrl: string;
  readonly appDefinitionId: string;
  readonly serviceAccountKeyId: ServiceAccountKeyId;
  readonly serviceAccountKey: ServiceAccountKey;
  readonly cma: PlainClientAPI;

  constructor(
    appDefinitionId: string,
    cma: PlainClientAPI,
    serviceAccountKeyId: ServiceAccountKeyId,
    serviceAccountKey: ServiceAccountKey
  ) {
    this.baseUrl = config.backendApiUrl;
    this.appDefinitionId = appDefinitionId;
    this.cma = cma;
    this.serviceAccountKeyId = serviceAccountKeyId;
    this.serviceAccountKey = serviceAccountKey;
  }

  async getCredentials(): Promise<Credentials> {
    return await fetchFromApi<Credentials>(
      this.requestUrl('api/credentials'),
      ZCredentials,
      this.appDefinitionId,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }

  appendQueryParams = (url: URL, queryParams: any) => {
    Object.keys(queryParams).forEach((key) => url.searchParams.append(key, queryParams[key]));
    return url;
  };

  private requestUrl(apiPath: string, queryParams?: any): URL {
    // if (queryParams) {
    //   const { startDate, endDate, propertyId, metrics, dimensions, slug } = queryParams;
    //   const params = ':startDate/:endDate/:propertyId/:slug'
    //   const url = `${this.baseUrl}/${apiPath}/${startDate}`;
    //   // const newUrl = new URL(url);
    // } else {
    const url = `${this.baseUrl}/${apiPath}`;
    const newUrl = new URL(url);
    if (queryParams) this.appendQueryParams(newUrl, queryParams);
    return newUrl;
    // }
  }

  async listAccountSummaries(): Promise<AccountSummaries> {
    return await fetchFromApi(
      this.requestUrl('api/account_summaries'),
      ZAccountSummaries,
      this.appDefinitionId,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }

  // TODO: When we actually hook this up to the sidebar chart, we will need to update this type and schema (similar to the listAccountSummaries pattern)
  // It's currently typed like this to provide maximum flexibility until we actually integrate with the chart
  async getRunReportData(): Promise<RunReportData> {
    return await fetchFromApi(
      this.requestUrl('api/run_report'),
      ZRunReportData,
      this.appDefinitionId,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }


  async runReports(params: RunReportParamsType): Promise<any> {
    // TYPE
    return await fetchFromApi<any>(
      this.requestUrl(`api/run_report`, params),
      ZCredentials,
      this.appDefinitionId,
      this.cma,
      {
        ...this.serviceAccountKeyHeaders,
        ...this.contentfulContextHeaders,
      }
    );
  }

  async runReports(params: RunReportParamsType): Promise<any> {
    // TYPE
    return await fetchFromApi<any>(
      this.requestUrl(`api/run_report`, params),
      ZCredentials,
      this.appDefinitionId,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }

  private get serviceAccountKeyHeaders(): Headers {
    return {
      'X-Contentful-ServiceAccountKeyId': this.encodeServiceAccountHeaderValue(
        this.serviceAccountKeyId
      ),
      'X-Contentful-ServiceAccountKey': this.encodeServiceAccountHeaderValue(
        this.serviceAccountKey
      ),
    };
  }

  // stringify + base64encode the header value so it can be packaged into header safely
  private encodeServiceAccountHeaderValue(
    headerValue: ServiceAccountKeyId | ServiceAccountKey
  ): string {
    const jsonString = JSON.stringify(headerValue);
    return window.btoa(jsonString);
  }
}
