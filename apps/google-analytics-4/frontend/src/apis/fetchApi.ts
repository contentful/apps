import { z } from 'zod';
import fetchWithSignedRequest from '../helpers/signed-requests';
import { ApiError } from 'apis/api';
import { Headers, ApiErrorType, ERROR_TYPE_MAP, ZApiErrorResponse } from 'apis/apiTypes';
import { CMAClient } from '@contentful/app-sdk';

export async function fetchFromApi<T>(
  apiUrl: URL,
  schema: z.ZodTypeAny,
  appDefinitionId: string,
  cma: CMAClient,
  headers: Headers = {}
): Promise<T> {
  const response = await fetchResponse(apiUrl, appDefinitionId, cma, headers);
  const responseJson = await jsonFromResponse(response);
  validateResponseStatus(response, responseJson);
  parseResponseJson(responseJson, schema);
  return responseJson;
}

async function fetchResponse(
  url: URL,
  appDefinitionId: string,
  cma: CMAClient,
  headers: Headers
): Promise<Response> {
  try {
    const signedResponse = await fetchWithSignedRequest(url, appDefinitionId, cma, 'GET', headers);
    return signedResponse;
  } catch (e) {
    if (e instanceof TypeError) {
      const responseError: ApiErrorType = {
        message: e.message,
        errorType: ERROR_TYPE_MAP.failedFetch,
        details: null,
        status: 500,
      };
      throw new ApiError(responseError);
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
      const responseError: ApiErrorType = {
        message: e.message,
        errorType: ERROR_TYPE_MAP.invalidJson,
        details: null,
        status: 500,
      };
      throw new ApiError(responseError);
    }
    throw e;
  }
}

function validateResponseStatus(response: Response, responseJson: any): void {
  if (response.status >= 400) {
    try {
      const apiErrorResponse = ZApiErrorResponse.parse(responseJson);
      throw new ApiError(apiErrorResponse.errors);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        const responseError: ApiErrorType = {
          message: e.message,
          errorType: ERROR_TYPE_MAP.unexpected,
          details: null,
          status: response.status,
        };
        throw new ApiError(responseError);
      }
      throw e;
    }
  }
}

function parseResponseJson(responseJson: any, schema: z.ZodTypeAny) {
  try {
    schema.parse(responseJson);
  } catch (e) {
    if (e instanceof z.ZodError) {
      const responseError: ApiErrorType = {
        message: e.message,
        errorType: ERROR_TYPE_MAP.malformedApiResponse,
        details: null,
        status: 500,
      };
      throw new ApiError(responseError);
    }
    throw e;
  }
}
