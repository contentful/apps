import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from './muxProxy';

type HandlerEvent = Parameters<typeof handler>[0];
type HandlerContext = Parameters<typeof handler>[1];

const makeEvent = (body: { method: string; path: string; body?: string }): HandlerEvent =>
  ({ body } as unknown as HandlerEvent);

const makeContext = (tokenId?: string, tokenSecret?: string): HandlerContext =>
  ({
    appInstallationParameters: {
      ...(tokenId ? { muxAccessTokenId: tokenId } : {}),
      ...(tokenSecret ? { muxAccessTokenSecret: tokenSecret } : {}),
    },
  } as unknown as HandlerContext);

const validContext = () => makeContext('test-token-id', 'test-token-secret');

describe('muxProxy handler', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns 401 when Mux credentials are missing', async () => {
    const result = await handler(
      makeEvent({ method: 'GET', path: '/video/v1/assets/abc123' }),
      makeContext()
    );

    expect(result).toEqual({ ok: false, error: 'Missing Mux API credentials', status: 401 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an @-authority override path with 403 before calling fetch', async () => {
    const result = await handler(
      makeEvent({ method: 'GET', path: '@attacker.com/capture' }),
      validContext()
    );

    expect(result).toEqual({ ok: false, error: 'Path not permitted', status: 403 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an absolute-URL override path with 403 before calling fetch', async () => {
    const result = await handler(
      makeEvent({ method: 'GET', path: 'https://attacker.com/capture' }),
      validContext()
    );

    expect(result).toEqual({ ok: false, error: 'Path not permitted', status: 403 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a path outside the /video/v1/ allowlist with 403 before calling fetch', async () => {
    const result = await handler(
      makeEvent({ method: 'GET', path: '/other/v1/endpoint' }),
      validContext()
    );

    expect(result).toEqual({ ok: false, error: 'Path not permitted', status: 403 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a path that traverses out of /video/v1/ after normalization with 403 before calling fetch', async () => {
    const result = await handler(
      makeEvent({ method: 'GET', path: '/video/v1/assets/123/../../../signing-keys' }),
      validContext()
    );

    expect(result).toEqual({ ok: false, error: 'Path not permitted', status: 403 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 502 on a network error calling Mux', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    const result = await handler(
      makeEvent({ method: 'GET', path: '/video/v1/assets/abc123' }),
      validContext()
    );

    expect(result).toEqual({ ok: false, error: 'Network error calling Mux API', status: 502 });
  });

  it('passes through a non-OK Mux response as an error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { messages: ['Asset not found'] } }),
    } as Response);

    const result = await handler(
      makeEvent({ method: 'GET', path: '/video/v1/assets/missing' }),
      validContext()
    );

    expect(result).toEqual({ ok: false, error: 'Asset not found', status: 404 });
  });

  it('returns empty data for a 204 response', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 204 } as Response);

    const result = await handler(
      makeEvent({ method: 'DELETE', path: '/video/v1/assets/abc123' }),
      validContext()
    );

    expect(result).toEqual({ ok: true, data: {} });
  });

  it('returns the parsed JSON body for a normal 200 response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 'abc123', status: 'ready' } }),
    } as Response);

    const result = await handler(
      makeEvent({ method: 'GET', path: '/video/v1/assets/abc123' }),
      validContext()
    );

    expect(result).toEqual({ ok: true, data: { data: { id: 'abc123', status: 'ready' } } });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.mux.com/video/v1/assets/abc123',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
