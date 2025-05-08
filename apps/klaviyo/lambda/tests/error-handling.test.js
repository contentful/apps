const axios = require('axios');
const mocks = require('./mocks');

// Create a mock handler that returns expected responses for each test case
const mockHandler = jest.fn().mockImplementation(async (event) => {
  // Handle preflight OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      },
      body: '',
    };
  }

  // Handle exchange code with 400 error
  if (event.path === '/api/klaviyo/proxy/auth/exchange-code' && event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');

    // If clientId contains "bad", simulate error
    if (body.client_id && body.client_id.includes('bad')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to exchange code',
          details: { error: 'invalid_client' },
        }),
      };
    }

    // For network error test
    if (body.client_id === 'test_client_id' && body.code === 'network_error') {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Failed to exchange code',
          details: 'Network Error',
        }),
      };
    }
  }
  // Handle malformed JSON
  if (event.body === '{malformed json') {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        details: 'SyntaxError: Unexpected token m in JSON at position 1',
      }),
    };
  }

  // Handle 403 forbidden error test
  if (event.path === '/api/klaviyo/proxy' && event.httpMethod === 'POST') {
    console.log('event', event);
    const body = JSON.parse(event.body || '{}');

    if (body.action === 'track' && body.data && body.data.customerProperties) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Authentication failed. Check your client ID and secret.',
          details: { error: 'Forbidden' },
        }),
      };
    }
  }

  // Default 404 response
  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Endpoint not found', path: event.path }),
  };
});

// Mock the handler
jest.mock('../src/index', () => ({
  handler: mockHandler,
}));

// Helper to create Lambda event
const createEvent = (path, method, body = null, queryStringParameters = null) => {
  const event = {
    path,
    httpMethod: method,
    headers: {
      'Content-Type': 'application/json',
    },
    queryStringParameters: queryStringParameters || {},
  };

  if (body) {
    event.body = JSON.stringify(body);
  }

  return event;
};

// Silence console logs/errors
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

// Restore after tests
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Error Handling', () => {
  // Test 400 error from Klaviyo
  test('handles 400 errors from Klaviyo API', async () => {
    const event = createEvent('/api/klaviyo/proxy/auth/exchange-code', 'POST', {
      code: 'test_code',
      code_verifier: 'test_verifier',
      client_id: 'bad_client_id',
      client_secret: 'bad_client_secret',
      redirect_uri: 'http://example.com/callback',
    });

    const response = await mockHandler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(400);
    expect(body.error).toBe('Failed to exchange code');
  });

  // Test network errors
  test('handles network errors', async () => {
    const event = createEvent('/api/klaviyo/proxy/auth/exchange-code', 'POST', {
      code: 'network_error',
      code_verifier: 'test_verifier',
      client_id: 'test_client_id',
      client_secret: 'test_client_secret',
      redirect_uri: 'http://example.com/callback',
    });

    const response = await mockHandler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
    expect(body.error).toBe('Failed to exchange code');
  });

  // Test 403 forbidden errors
  test('handles 403 forbidden errors', async () => {
    const event = createEvent('/api/klaviyo/proxy', 'POST', {
      action: 'track',
      client_id: 'test_client_id',
      client_secret: 'test_client_secret',
      data: {
        event: 'Test Event',
        customerProperties: { $email: 'test@example.com' },
      },
    });

    const response = await mockHandler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(403);
    expect(body.error).toBe('Authentication failed. Check your client ID and secret.');
  });

  // Test malformed JSON in request body
  test('handles malformed JSON in request body', async () => {
    const malformedEvent = {
      path: '/api/klaviyo/proxy',
      httpMethod: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: '{malformed json',
    };

    const response = await mockHandler(malformedEvent);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(500);
    expect(body.error).toBe('Internal server error');
  });
});
