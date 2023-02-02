import { z } from 'zod';
import { config } from '../config';
import fetchWithSignedRequest from '../helpers/signed-requests';
import { PlainClientAPI } from 'contentful-management';
import { ServiceAccountKeyId, ServiceAccountKey } from '../types';

const ZCredentials = z.object({
  status: z.string(),
});

export type Credentials = z.infer<typeof ZCredentials>;

export class ApiError extends Error {}
export class ApiServerError extends ApiError {}
export class ApiClientError extends ApiError {}

export async function fetchFromApi<T>(
  apiUrl: URL,
  schema: z.ZodTypeAny,
  appDefinitionId: string,
  cma: PlainClientAPI
): Promise<T> {
  const response = await fetchResponse(apiUrl, appDefinitionId, cma);
  validateResponseStatus(response);
  const responseJson = await jsonFromResponse(response);
  parseResponseJson(responseJson, schema);
  return responseJson;
}

async function fetchResponse(
  url: URL,
  appDefinitionId: string,
  cma: PlainClientAPI
): Promise<Response> {
  try {
    return await fetchWithSignedRequest(url, appDefinitionId, cma, 'GET', {});
  } catch (e) {
    if (e instanceof TypeError) {
      const errorMessage = e.message;
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
      this.cma
    );
  }

  private requestUrl(apiPath: string): URL {
    const url = `${this.baseUrl}/${apiPath}`;
    return new URL(url);
  }
}
