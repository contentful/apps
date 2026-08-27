import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../../functions/exchangeAsanaOAuthCode';

globalThis.fetch = vi.fn();

describe('exchangeAsanaOAuthCode handler', () => {
  const mockContext = {
    spaceId: 'test-space',
    environmentId: 'test-env',
  } as unknown as FunctionEventContext;

  const createEvent = (body: Record<string, string>): AppActionRequest<'Custom'> =>
    ({
      type: FunctionTypeEnum.AppActionCall,
      body,
      headers: {},
    }) as AppActionRequest<'Custom'>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a failure without calling fetch when required parameters are missing', async () => {
    const result = await handler(
      createEvent({ code: 'auth-code' }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({ success: false, message: 'Missing required OAuth parameters.' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('exchanges a code for tokens on success', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: 'fresh-access-token',
        refresh_token: 'fresh-refresh-token',
        expires_in: 3600,
      }),
    } as Response);

    const result = await handler(
      createEvent({
        code: 'auth-code',
        codeVerifier: 'verifier',
        redirectUri: 'https://example.com/?oauthCallback=1',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: true,
      message: 'Connected to Asana.',
      accessToken: 'fresh-access-token',
      refreshToken: 'fresh-refresh-token',
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://app.asana.com/-/oauth_token',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('returns the Asana error message when the exchange fails', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'invalid_grant',
        error_description: 'The authorization code is invalid or expired.',
      }),
    } as Response);

    const result = await handler(
      createEvent({
        code: 'stale-code',
        codeVerifier: 'verifier',
        redirectUri: 'https://example.com/?oauthCallback=1',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      }) as Parameters<typeof handler>[0],
      mockContext
    );

    expect(result).toEqual({
      success: false,
      message: 'The authorization code is invalid or expired.',
    });
  });
});
