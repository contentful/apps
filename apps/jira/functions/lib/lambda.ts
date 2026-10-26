import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface HTTPHeaders {
  [key: string]: string;
}

export interface HTTPResponse {
  statusCode: number;
  body?: any;
  headers?: HTTPHeaders;
}

export const generateAPIGatewayResponse = (response: HTTPResponse): APIGatewayProxyResult => {
  return {
    statusCode: response.statusCode,
    body: response.body ? JSON.stringify(response.body) : '',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...response.headers,
    },
  };
};

export const handleLambdaHTTPEvent =
  (handler: (arg: APIGatewayProxyEvent) => Promise<HTTPResponse>) =>
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const response = await handler(event);
      return generateAPIGatewayResponse(response);
    } catch (err) {
      console.error('Failed to handle request', event, err);

      return generateAPIGatewayResponse({ statusCode: 500 });
    }
  };
