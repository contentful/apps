import { config } from '../config';
import {
  ServiceAccountKeyId,
  ServiceAccountKey,
  ContentfulContext,
  ContentfulContextHeaders,
  RunReportParamsType,
} from '../types';
import { fetchFromApi } from 'apis/fetchApi';
import {
  Headers,
  ApiErrorType,
  Credentials,
  ZRunReportData,
  ZCredentials,
  AccountSummaries,
  ZAccountSummaries,
  RunReportData,
} from 'apis/apiTypes';
import { upperFirst } from 'lodash';
import { CMAClient } from '@contentful/app-sdk';

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
  readonly contentfulContext: ContentfulContext;
  readonly serviceAccountKeyId: ServiceAccountKeyId;
  readonly cma: CMAClient;

  constructor(
    contentfulContext: ContentfulContext,
    cma: CMAClient,
    serviceAccountKeyId: ServiceAccountKeyId
  ) {
    this.baseUrl = config.backendApiUrl;
    this.contentfulContext = contentfulContext;
    this.cma = cma;
    this.serviceAccountKeyId = serviceAccountKeyId;
  }

  async getServiceAccountKeyFile(): Promise<Credentials> {
    return await fetchFromApi<Credentials>(
      this.requestUrl('api/service_account_key_file'),
      ZCredentials,
      this.contentfulContext.app!,
      this.cma,
      {
        ...this.serviceAccountKeyHeaders,
        ...this.contentfulContextHeaders,
      }
    );
  }

  encodeParam = (param: any) => encodeURIComponent(param);

  appendQueryParams = (url: URL, queryParams: any) => {
    Object.keys(queryParams).forEach((key) => url.searchParams.append(key, queryParams[key]));
    return url;
  };

  private requestUrl(apiPath: string, queryParams?: any): URL {
    const url = `${this.baseUrl}/${apiPath}`;
    const newUrl = new URL(url);
    if (queryParams) this.appendQueryParams(newUrl, queryParams);
    return newUrl;
  }

  async listAccountSummaries(): Promise<AccountSummaries> {
    return await fetchFromApi(
      this.requestUrl('api/account_summaries'),
      ZAccountSummaries,
      this.contentfulContext.app!,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }

  // TODO: When we actually hook this up to the sidebar chart, we will need to update this type and schema (similar to the listAccountSummaries pattern)
  // It's currently typed like this to provide maximum flexibility until we actually integrate with the chart
  async runReports(params?: RunReportParamsType): Promise<RunReportData> {
    return await fetchFromApi(
      this.requestUrl('api/run_report', params),
      ZRunReportData,
      this.contentfulContext.app!,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }

  private get serviceAccountKeyHeaders(): Headers {
    return {
      'X-Contentful-ServiceAccountKeyId': this.encodeServiceAccountHeaderValue(
        this.serviceAccountKeyId
      ),
    };
  }

  private get contentfulContextHeaders() {
    const headers: ContentfulContextHeaders = {};
    for (const [key, value] of Object.entries(this.contentfulContext)) {
      const headerKey = `X-Contentful-${upperFirst(key)}` as keyof ContentfulContextHeaders;
      headers[headerKey] = value;
    }

    return headers;
  }

  // stringify + base64encode the header value so it can be packaged into header safely
  private encodeServiceAccountHeaderValue(
    headerValue: ServiceAccountKeyId | ServiceAccountKey
  ): string {
    const jsonString = JSON.stringify(headerValue);
    return window.btoa(jsonString);
  }
}
