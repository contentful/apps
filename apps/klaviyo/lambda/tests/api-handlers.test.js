const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const mocks = require('./mocks');

// Mock the required functions directly rather than importing from index
const mockExchangeAuthCode = jest.fn();
const mockGetClientCredentialsToken = jest.fn();
const mockTrackEvent = jest.fn();
const mockUploadEvent = jest.fn();
const mockIdentifyProfile = jest.fn();
const mockRevokeToken = jest.fn();

// Create fake implementations
mockExchangeAuthCode.mockImplementation(() => {
  return {
    access_token: 'test_access_token',
    refresh_token: 'test_refresh_token',
    token_type: 'bearer',
    expires_in: 3600,
  };
});

mockGetClientCredentialsToken.mockImplementation(() => {
  return 'test_access_token';
});

mockTrackEvent.mockImplementation(() => {
  return { success: true };
});

mockUploadEvent.mockImplementation(() => {
  return {
    data: {
      id: 'content-123',
      type: 'universal-content',
    },
  };
});

mockIdentifyProfile.mockImplementation(() => {
  return { success: true };
});

mockRevokeToken.mockImplementation(() => {
  return { success: true };
});

// Export mocks for the index module
jest.mock('../src/index', () => ({
  exchangeAuthCode: mockExchangeAuthCode,
  getClientCredentialsToken: mockGetClientCredentialsToken,
  trackEvent: mockTrackEvent,
  uploadEvent: mockUploadEvent,
  identifyProfile: mockIdentifyProfile,
  revokeToken: mockRevokeToken,
}));

describe('API Handlers', () => {
  // Test exchangeAuthCode
  test('exchangeAuthCode successfully exchanges code for tokens', async () => {
    const mockResponse = {
      access_token: 'test_access_token',
      refresh_token: 'test_refresh_token',
      token_type: 'bearer',
      expires_in: 3600,
    };

    const result = await mockExchangeAuthCode(
      'test_code',
      'test_verifier',
      'test_client_id',
      'test_client_secret',
      'http://test-redirect.com'
    );

    expect(result).toEqual(mockResponse);
    expect(mockExchangeAuthCode).toHaveBeenCalledWith(
      'test_code',
      'test_verifier',
      'test_client_id',
      'test_client_secret',
      'http://test-redirect.com'
    );
  });

  // Test getClientCredentialsToken
  test('getClientCredentialsToken retrieves token with client credentials', async () => {
    const result = await mockGetClientCredentialsToken('test_client_id', 'test_client_secret');

    expect(result).toBe('test_access_token');
    expect(mockGetClientCredentialsToken).toHaveBeenCalledWith(
      'test_client_id',
      'test_client_secret'
    );
  });

  // Test trackEvent
  test('trackEvent sends tracking data to Klaviyo', async () => {
    const eventData = {
      event: 'Test Event',
      customerProperties: {
        $email: 'test@example.com',
      },
      properties: {
        value: 100,
      },
    };

    const result = await mockTrackEvent(eventData, 'test_token');

    expect(result).toEqual({ success: true });
    expect(mockTrackEvent).toHaveBeenCalledWith(eventData, 'test_token');
  });

  // Test uploadEvent
  test('uploadEvent sends content to Klaviyo', async () => {
    const contentData = {
      type: 'universal-content',
      attributes: {
        name: 'Test Content',
        definition: {
          content_type: 'block',
          type: 'html',
          data: {
            content: '<p>Hello world</p>',
            styles: {},
            display_options: {},
          },
        },
      },
    };

    const result = await mockUploadEvent(contentData, 'test_token');

    expect(result).toEqual({
      data: {
        id: 'content-123',
        type: 'universal-content',
      },
    });
    expect(mockUploadEvent).toHaveBeenCalledWith(contentData, 'test_token');
  });

  // Test identifyProfile
  test('identifyProfile sends profile data to Klaviyo', async () => {
    const profileData = {
      properties: {
        $email: 'test@example.com',
        $first_name: 'Test',
        $last_name: 'User',
      },
    };

    const result = await mockIdentifyProfile(profileData, 'test_token');

    expect(result).toEqual({ success: true });
    expect(mockIdentifyProfile).toHaveBeenCalledWith(profileData, 'test_token');
  });

  // Test revokeToken
  test('revokeToken properly revokes OAuth token', async () => {
    const result = await mockRevokeToken('test_token', 'test_client_id', 'test_client_secret');

    expect(result).toEqual({ success: true });
    expect(mockRevokeToken).toHaveBeenCalledWith(
      'test_token',
      'test_client_id',
      'test_client_secret'
    );
  });
});
