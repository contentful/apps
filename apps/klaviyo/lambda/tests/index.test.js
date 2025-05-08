const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { handler } = require('../src/index');

// Mock axios
let mockAxios;

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

// Set up mocks before each test
beforeEach(() => {
  // Create a fresh MockAdapter for each test
  mockAxios = new MockAdapter(axios);

  // Silence console output
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

// Restore mocks after each test
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Lambda Handler', () => {
  // Test CORS preflight
  test('handles OPTIONS requests for CORS preflight', async () => {
    const event = createEvent('/api/klaviyo/proxy', 'OPTIONS');
    const response = await handler(event);

    expect(response.statusCode).toBe(204);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
  });

  // Test 404 for unknown endpoints
  test('returns 404 for unknown endpoints', async () => {
    const event = createEvent('/invalid/path', 'GET');
    const response = await handler(event);
    const body = JSON.parse(response.body);

    expect(response.statusCode).toBe(404);
    expect(body.error).toBe('Endpoint not found');
  });

  // Test OAuth callback HTML response
  test('returns HTML for OAuth callback', async () => {
    const event = createEvent('/auth/callback', 'GET', null, {
      code: 'test_code',
      state: 'test_state',
    });

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('text/html');
    expect(response.body).toContain('<!DOCTYPE html>');
    expect(response.body).toContain('Klaviyo Authorization');
  });
});
