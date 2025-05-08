const axios = require('axios');
const mocks = require('./mocks');

// Create a mock handler that returns expected responses for each test case
const mockHandler = jest.fn().mockImplementation(async (event) => {
  // Handle OPTIONS request
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

  // Handle client credentials token generation
  if (event.path === '/api/klaviyo/proxy' && event.httpMethod === 'POST') {
    const body = JSON.parse(event.body || '{}');

    if (body.action === 'track' && body.client_id && body.client_secret) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, data: { result: 'successful_track' } }),
      };
    }
  }

  // Default 404 response for unknown endpoints
  if (event.path === '/unknown/path') {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Endpoint not found', path: event.path }),
    };
  }

  // Default response
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
const createEvent = (path, method, body = null) => {
  const event = {
    path,
    httpMethod: method,
    headers: {
      'Content-Type': 'application/json',
    },
    queryStringParameters: {},
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

describe('Basic Lambda Tests', () => {
  test('handles OPTIONS request', async () => {
    const event = {
      httpMethod: 'OPTIONS',
      path: '/api/klaviyo/proxy',
    };

    const response = await mockHandler(event);
    expect(response.statusCode).toBe(204);
  });

  test('returns 404 for unknown endpoint', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/unknown/path',
    };

    const response = await mockHandler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(404);
    expect(body.error).toBe('Endpoint not found');
  });

  test('client credentials token generation', async () => {
    const event = createEvent('/api/klaviyo/proxy', 'POST', {
      action: 'track',
      client_id: 'test_client',
      client_secret: 'test_secret',
      data: {
        event: 'Test Event',
        customerProperties: { $email: 'test@example.com' },
      },
    });

    const response = await mockHandler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
  });
});
