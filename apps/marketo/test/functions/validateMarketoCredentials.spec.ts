import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../functions/validateMarketoCredentials';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { AppInstallationParameters } from '../../src/types';
import { INVALID_CREDENTIALS_RESPONSE, VALID_CREDENTIALS_RESPONSE } from '../../src/const';

globalThis.fetch = vi.fn();

describe('validateMarketoCredentials handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    appInstallationParameters: {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      munchkinId: 'test-munchkin',
    },
    spaceId: 'test-space',
    environmentId: 'test-env',
  } as unknown as FunctionEventContext;

  const mockEvent = {
    type: FunctionTypeEnum.AppActionCall,
    body: {},
  } as unknown as AppActionRequest<'Custom'>;

  const mockFetchUrl = (munchkinId: string, clientId: string, clientSecret: string) =>
    `https://${munchkinId}.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;

  it('should return valid: true when auth succeeds', async () => {
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'test-token',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
    } as Response);

    const result = await handler(mockEvent as Parameters<typeof handler>[0], mockContext);

    expect(result).toEqual({
      valid: true,
      message: VALID_CREDENTIALS_RESPONSE,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      mockFetchUrl('test-munchkin', 'test-client-id', 'test-client-secret')
    );
  });

  it('should allow custom message from marketo when auth fails', async () => {
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: 'invalid_client', error_description: 'Bad client credentials' }),
    } as Response);

    const result = await handler(mockEvent as Parameters<typeof handler>[0], mockContext);

    expect(result).toEqual({
      valid: false,
      message: 'Marketo authentication failed: Bad client credentials',
    });
  });

  it('should return valid: false with message when response has no access_token', async () => {
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token_type: 'Bearer', expires_in: 3600 }),
    } as Response);

    const result = await handler(mockEvent as Parameters<typeof handler>[0], mockContext);

    expect(result).toEqual({
      valid: false,
      message: INVALID_CREDENTIALS_RESPONSE,
    });
  });

  it('should use call parameters when provided', async () => {
    const mockFetch = vi.mocked(fetch);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', token_type: 'Bearer', expires_in: 3600 }),
    } as Response);

    await handler(
      {
        ...mockEvent,
        body: {
          clientId: 'body-id',
          clientSecret: 'body-secret',
          munchkinId: 'body-munchkin',
        } as AppInstallationParameters,
      } as Parameters<typeof handler>[0],
      mockContext
    );

    expect(mockFetch).toHaveBeenCalledWith(mockFetchUrl('body-munchkin', 'body-id', 'body-secret'));
  });
});
