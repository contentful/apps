import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../proxyRequest';

function buildEvent(body: Record<string, any>) {
  return { body } as any;
}

function buildContext(token: { tokenType: string; accessToken: string } = {
  tokenType: 'Bearer',
  accessToken: 'test-access-token',
}) {
  return {
    oauthSdk: {
      token: vi.fn().mockResolvedValue(token),
    },
  } as any;
}

describe('proxyRequest endpoint allowlist', () => {
  beforeEach(() => {
    (global.fetch as any) = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: [] }),
    });
  });

  it('allows an exact allowlisted endpoint', async () => {
    const result = await handler(
      buildEvent({
        endpoint: 'template-universal-content',
        method: 'GET',
        data: { foo: 'bar' },
        params: { page: 1 },
      }),
      buildContext()
    );

    expect(result).not.toEqual({ response: { error: 'Endpoint not allowed' } });
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it('allows an allowlisted endpoint followed by a single id segment', async () => {
    const result = await handler(
      buildEvent({
        endpoint: 'template-universal-content/abc123',
        method: 'GET',
        data: { foo: 'bar' },
        params: { page: 1 },
      }),
      buildContext()
    );

    expect(result).not.toEqual({ response: { error: 'Endpoint not allowed' } });
    expect(global.fetch).toHaveBeenCalledOnce();
  });

  it('rejects a path-traversal endpoint that resolves outside the allowlist', async () => {
    const result = await handler(
      buildEvent({
        endpoint: 'template-universal-content/../lists',
        method: 'GET',
        data: { foo: 'bar' },
        params: { page: 1 },
      }),
      buildContext()
    );

    expect(result).toEqual({ response: { error: 'Endpoint not allowed' } });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects an endpoint not on the allowlist at all', async () => {
    const result = await handler(
      buildEvent({
        endpoint: 'lists',
        method: 'GET',
        data: { foo: 'bar' },
        params: { page: 1 },
      }),
      buildContext()
    );

    expect(result).toEqual({ response: { error: 'Endpoint not allowed' } });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects an endpoint with a trailing traversal segment appended to a real id', async () => {
    const result = await handler(
      buildEvent({
        endpoint: 'template-universal-content/abc123/../../lists',
        method: 'GET',
        data: { foo: 'bar' },
        params: { page: 1 },
      }),
      buildContext()
    );

    expect(result).toEqual({ response: { error: 'Endpoint not allowed' } });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
