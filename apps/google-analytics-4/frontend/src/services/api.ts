import { z } from 'zod';
import { config } from '../config';
import fetchWithSignedRequest from '../helpers/signed-requests';
import { PlainClientAPI } from 'contentful-management';
import { ServiceAccountKeyId, ServiceAccountKey } from '../types';

const ZCredentials = z.object({
  status: z.string(),
});

const ZPropertySummary = z.object({
  property: z.string(),
  displayName: z.string(),
  propertyType: z.string(),
});
export type PropertySummary = z.infer<typeof ZPropertySummary>;

const ZAccountSummary = z.object({
  name: z.string(),
  account: z.string(),
  displayName: z.string(),
  propertySummaries: z.array(ZPropertySummary),
});

// TODO: Once we nail down our custom error architecture, update this
const ZCustomApiError = z.object({
  errors: z.any(),
  res: z.any(),
});
export type CustomApiError = z.infer<typeof ZCustomApiError>;

const ZAccountSummariesSchema = z.array(ZAccountSummary).or(ZCustomApiError)
const ZAccountSummariesWithError = ZAccountSummariesSchema.and(ZCustomApiError)
export type AccountSummariesWithError = z.infer<typeof ZAccountSummariesWithError>;

const ZPageDataQuery = z.object({});

type Headers = Record<string, string>;

export type Credentials = z.infer<typeof ZCredentials>;

export class ApiError extends Error { }
export class ApiServerError extends ApiError { }
export class ApiClientError extends ApiError { }
export class ApiGA4Error extends ApiError {
  readonly res: any
  constructor(res: any) {
    super();
    this.res = res;
  }
}

export async function fetchFromApi<T>(
  apiUrl: URL,
  schema: z.ZodTypeAny,
  appDefinitionId: string,
  cma: PlainClientAPI,
  headers: Headers = {}
): Promise<T> {
  const response = await fetchResponse(apiUrl, appDefinitionId, cma, headers);
  validateResponseStatus(response)
  const responseJson = await jsonFromResponse(response);
  // decorateResponseJson(response, responseJson);
  parseResponseJson(responseJson, schema);
  return responseJson;
}

async function fetchResponse(
  url: URL,
  appDefinitionId: string,
  cma: PlainClientAPI,
  headers: Headers
): Promise<Response> {
  try {
    const signedResponse = await fetchWithSignedRequest(url, appDefinitionId, cma, 'GET', headers);
    return signedResponse;
  } catch (e) {
    if (e instanceof TypeError) {
      const errorMessage = e.message;
      throw new ApiError(errorMessage);
    }
    throw e;
  }
}

function parseResponseJson(responseJson: any, schema: z.ZodTypeAny) {
  try {
    schema.parse(responseJson);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const errorMessage = 'Invalid response from API';
      console.error(errorMessage);
      console.error(e.message);
      console.error(responseJson);
      throw new ApiError(errorMessage);
    }
    throw e;
  }
}

async function jsonFromResponse(response: Response): Promise<any> {
  try {
    const json = await response.json();
    return json;
  } catch (e) {
    if (e instanceof SyntaxError) {
      const errorMessage = `Invalid JSON response: ${e.message}`;
      console.error(errorMessage);
      console.error(response);
      throw new ApiError(errorMessage);
    }
    throw e;
  }
}

// function decorateResponseJson(response: Response, responseJson: any): any {
//   responseJson.res = {
//     ok: response.ok,
//     status: response.status,
//     statusText: response.statusText,
//   }
// }

function validateResponseStatus(response: any): void{
  if (response.status >= 500) {
    console.error(response);
    throw new ApiGA4Error(response);
  } else if (response.status >= 400) {
    console.error(response);
    throw new ApiGA4Error(response);
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

  private requestUrl(apiPath: string): URL {
    const url = `${this.baseUrl}/${apiPath}`;
    return new URL(url);
  }

  async listAccountSummaries(): Promise<AccountSummariesWithError> {
    return await fetchFromApi(
      this.requestUrl('api/account_summaries'),
      ZAccountSummariesSchema,
      this.appDefinitionId,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }


  // TODO: When we actually hook this up to the sidebar chart, we will need to update this type and schema (similar to the listAccountSummaries pattern)
  // It's currently typed like this to provide maximum flexibility until we actually integrate with the chart
  async getPageData(): Promise<CustomApiError> {
    return await fetchFromApi(
      this.requestUrl('api/run_report'),
      ZPageDataQuery,
      this.appDefinitionId,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }

  private get serviceAccountKeyHeaders(): Headers {
    return {
      'x-contentful-serviceaccountkeyid': this.encodeServiceAccountHeaderValue(
        this.serviceAccountKeyId
      ),
      'x-contentful-serviceaccountkey': this.encodeServiceAccountHeaderValue(
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
