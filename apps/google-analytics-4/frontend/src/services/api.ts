import { z } from 'zod';
import { config } from '../config';

const ZCredentials = z.object({
  status: z.string(),
});
export type Credentials = z.infer<typeof ZCredentials>;

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

export class ApiError extends Error { }
export class ApiServerError extends ApiError { }
export class ApiClientError extends ApiError { }
export class GoogleApiError extends ApiError {
  code: number;
  details: string;
  name: string;

  constructor({code, details, name} = {code: 0, details: '', name:''}) {
    super();
    this.code = code;
    this.details = details;
    this.name = name;
  }
}

export async function fetchFromApi<T>(apiUrl: URL, schema: z.ZodTypeAny): Promise<T> {
  const { response, data } = await fetchResponse<T>(apiUrl);
  validateResponseStatus(response);
  parseResponseJson(data, schema);
  return data;
}

async function fetchResponse<T>(url: URL): Promise<{ response: Response, data: T }> {
  try {
    const response = await fetch(url);
    const { data, errors } = await response.json();
    if (errors) {
      if (errors.code) {
        const googleApiError = new GoogleApiError(errors);
        throw googleApiError
      }
      else {
        throw errors;
      }
    } else {
      return { response, data };
    }
  } catch (e) {
    if (e instanceof TypeError) {
      const errorMessage = e.message;
      console.error(e);
      throw new ApiError(errorMessage);
    }
    else if (e instanceof SyntaxError) {
      const errorMessage = `Invalid JSON response: ${e.message}`;
      console.error(errorMessage);
      console.error(e);
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

  constructor() {
    this.baseUrl = config.backendApiUrl;
  }

  async getCredentials(): Promise<Credentials> {
    return await fetchFromApi<Credentials>(this.requestUrl('api/credentials'), ZCredentials);
  }

  async listAccountSummaries(): Promise<AccountSummaries> {
    return await fetchFromApi<AccountSummaries>(
      this.requestUrl('api/account_summaries'),
      ZAccountSummaries
    );
  }

  private requestUrl(apiPath: string): URL {
    const url = `${this.baseUrl}/${apiPath}`;
    return new URL(url);
  }
}

export const api = new Api();
