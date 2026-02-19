import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../functions/getMarketoForms';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { MarketoAuthenticationError, MarketoApiError } from '../../functions/exceptions';

// Mock fetch globally
global.fetch = vi.fn();

describe('getMarketoForms handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext: FunctionEventContext = {
    appInstallationParameters: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      munchkinId: 'test-munchkin',
    },
    cmaClientOptions: {},
    spaceId: 'test-space',
    environmentId: 'test-env',
  } as FunctionEventContext;

  const mockEvent: AppActionRequest<'Custom', {}> = {
    type: FunctionTypeEnum.AppActionCall,
    body: {},
  } as AppActionRequest<'Custom', {}>;

  it('should successfully fetch and return Marketo forms', async () => {
    const mockAuthResponse = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    const mockFormsResponse = {
      success: true,
      result: [
        {
          id: 'form-1',
          name: 'Contact Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/1.json',
        },
        {
          id: 'form-2',
          name: 'Newsletter Signup',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/2.json',
        },
      ],
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormsResponse,
      } as Response);

    const result = await handler(mockEvent, mockContext);

    expect(result).toEqual({
      forms: [
        {
          id: 'form-1',
          name: 'Contact Form',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/1.json',
        },
        {
          id: 'form-2',
          name: 'Newsletter Signup',
          url: 'https://test-munchkin.mktorest.com/rest/asset/v1/form/2.json',
        },
      ],
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'test-munchkin.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=test-client-id&client_secret=test-client-secret'
    );

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'test-munchkin.mktorest.com/rest/asset/v1/forms.json?maxReturn=200',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-access-token',
        },
      }
    );
  });

  it('should throw MarketoAuthenticationError when authentication fails', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      }),
    } as Response);

    await expect(handler(mockEvent, mockContext)).rejects.toThrow(MarketoAuthenticationError);
  });

  it('should throw MarketoApiError when getForms API call fails', async () => {
    const mockAuthResponse = {
      access_token: 'test-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    const mockErrorResponse = {
      success: false,
      errors: [
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded. Please try again later.',
        },
      ],
      message: 'Rate limit exceeded',
    };

    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockAuthResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => mockErrorResponse,
      } as Response);

    await expect(handler(mockEvent, mockContext)).rejects.toThrow(MarketoApiError);
  });
});
