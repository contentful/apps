import { z } from 'zod';
import { config } from '../config';

const ZCredentials = z.object({
  status: z.string(),
});

export type Credentials = z.infer<typeof ZCredentials>;

export class ApiError extends Error {}
export class ApiServerError extends ApiError {}
export class ApiClientError extends ApiError {}

export async function fetchFromApi<T>(apiUrl: URL, schema: z.ZodTypeAny): Promise<T> {
  const response = await fetchResponse(apiUrl);
  validateResponseStatus(response);
  const responseJson = await jsonFromResponse(response);
  parseResponseJson(responseJson, schema);
  return responseJson;
}

async function fetchResponse(url: URL): Promise<Response> {
  try {
    return await fetch(url);
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
  readonly baseUrlPathPrefix: string;

  constructor() {
    this.baseUrl = config.backendApiUrl;

    // some stages are included as the path, since the URL() constructor ignores
    // these we have to manually join the path in
    this.baseUrlPathPrefix = new URL(this.baseUrl).pathname;
  }

  async getCredentials(): Promise<Credentials> {
    return await fetchFromApi<Credentials>(this.requestUrl('/api/credentials'), ZCredentials);
  }

  private requestUrl(apiPath: string): URL {
    const fullApiPath = this.fullApiPath(apiPath);
    return new URL(fullApiPath, this.baseUrl);
  }

  private fullApiPath(apiPath: string): string {
    return (
      [this.baseUrlPathPrefix, apiPath]
        // remove one or more '/' from the front, and one or more '/' from the back of each segment
        .map((p) => p.trim().replace(/(^[/]*|[/]*$)/g, ''))
        .join('/')
    );
  }
}
