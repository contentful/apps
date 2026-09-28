import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { muxFetch, resolveMuxUrl } from './muxClient';

const credentials = { tokenId: 'test-token-id', tokenSecret: 'test-token-secret' };

describe('resolveMuxUrl', () => {
  it('resolves a legitimate path against the Mux API host', () => {
    const url = resolveMuxUrl('/video/v1/assets/abc123');
    expect(url.toString()).toBe('https://api.mux.com/video/v1/assets/abc123');
  });

  it('resolves a path without a leading slash against the Mux API host', () => {
    const url = resolveMuxUrl('video/v1/assets/abc123');
    expect(url.host).toBe('api.mux.com');
  });

  it('resolves an @-prefixed path as a literal path segment, not a userinfo/host override', () => {
    // The historical vulnerability came from string concatenation (`${base}${path}`),
    // which parses `https://api.mux.com@attacker.com/capture` as one absolute URL where
    // `api.mux.com` becomes userinfo and `attacker.com` becomes the host. Resolving `path`
    // against `base` with the two-argument `new URL()` form has no such ambiguity: `@` is
    // just a character in a relative path, so this stays on api.mux.com.
    const url = resolveMuxUrl('@attacker.com/capture');
    expect(url.toString()).toBe('https://api.mux.com/@attacker.com/capture');
  });

  it('throws for a protocol-relative override', () => {
    expect(() => resolveMuxUrl('//attacker.com/capture')).toThrow(/Invalid Mux API path/);
  });

  it('throws for an absolute-URL override', () => {
    expect(() => resolveMuxUrl('https://attacker.com/capture')).toThrow(/Invalid Mux API path/);
  });
});

describe('muxFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls fetch against the resolved Mux URL with Basic auth headers', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    await muxFetch(credentials, 'GET', '/video/v1/assets/abc123');

    expect(fetch).toHaveBeenCalledWith('https://api.mux.com/video/v1/assets/abc123', {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa('test-token-id:test-token-secret')}`,
        'Content-Type': 'application/json',
        'x-source-platform': 'contentful',
      },
      body: undefined,
    });
  });

  it('calls fetch against api.mux.com for an @-prefixed path, not an attacker host', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    await muxFetch(credentials, 'GET', '@attacker.com/capture');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.mux.com/@attacker.com/capture',
      expect.anything()
    );
  });

  it('rejects a protocol-relative override before calling fetch', async () => {
    await expect(muxFetch(credentials, 'GET', '//attacker.com/capture')).rejects.toThrow(
      /Invalid Mux API path/
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
