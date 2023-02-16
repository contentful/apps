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

export type AccountSummary = z.infer<typeof ZAccountSummary>;

const ZAccountSummaries = z.array(ZAccountSummary);
export type AccountSummaries = z.infer<typeof ZAccountSummaries>;

type Headers = Record<string, string>;

export type Credentials = z.infer<typeof ZCredentials>;

export class ApiError extends Error {}
export class ApiServerError extends ApiError {}
export class ApiClientError extends ApiError {}

export async function fetchFromApi<T>(
  apiUrl: URL,
  schema: z.ZodTypeAny,
  appDefinitionId: string,
  cma: PlainClientAPI,
  headers: Headers = {}
): Promise<T> {
  const response = await fetchResponse(apiUrl, appDefinitionId, cma, headers);
  validateResponseStatus(response);
  const responseJson = await jsonFromResponse(response);
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
    if (!signedResponse.ok) {
      const { errors } = await signedResponse.json();
      throw new ApiError(errors.message);
    }
    else return signedResponse;

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
    return await response.json();
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

function validateResponseStatus(response: Response): void {
  if (response.status >= 500) {
    console.error(response);
    throw new ApiServerError(`An unknown server error occurred. Status: ${response.status}`);
  } else if (response.status >= 400) {
    console.error(response);
    throw new ApiClientError(`An unknown client error occurred. Status: ${response.status}`);
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

  async listAccountSummaries(): Promise<AccountSummaries> {
    return await fetchFromApi<AccountSummaries>(
      this.requestUrl('api/account_summaries'),
      ZAccountSummaries,
      this.appDefinitionId,
      this.cma,
      this.serviceAccountKeyHeaders
    );
  }

  async listAccounts(): Promise<AccountSummaries> {
    return await fetchFromApi<AccountSummaries>(
      this.requestUrl('api/accounts'),
      ZAccountSummaries,
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
