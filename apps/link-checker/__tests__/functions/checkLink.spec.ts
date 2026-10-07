import { FunctionEventContext } from '@contentful/node-apps-toolkit';
import {
  CheckLinkInstallationParameters,
  COMPATIBILITY_USER_AGENT,
  handler,
  LINK_CHECKER_USER_AGENT,
  resolveCheckLinkUserAgent,
} from '../../functions/checkLink';
import { vi } from 'vitest';

function testContext(
  appInstallationParameters: CheckLinkInstallationParameters = {}
): FunctionEventContext<CheckLinkInstallationParameters> {
  return {
    spaceId: 'test-space',
    environmentId: 'master',
    appInstallationParameters,
  };
}

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
});

describe('checkLink handler', () => {
  it('returns error when url is missing', async () => {
    const result = await handler({ body: {} });
    expect(result).toEqual({ error: 'Missing or invalid url parameter' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error when url is empty string', async () => {
    const result = await handler({ body: { url: '   ' } });
    expect(result).toEqual({ error: 'Missing or invalid url parameter' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error when url is not http or https', async () => {
    const result = await handler({ body: { url: 'ftp://example.com' } });
    expect(result).toEqual({ error: 'URL must use http or https' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns error when url is relative path', async () => {
    const result = await handler({ body: { url: '/about' } });
    expect(result).toEqual({ error: 'URL must use http or https' });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns status when fetch succeeds with 200', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true, url: 'https://example.com' });
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ status: 200 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': LINK_CHECKER_USER_AGENT },
      })
    );
  });

  it('uses compatibility User-Agent when installation parameter is enabled', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true, url: 'https://example.com' });
    await handler(
      { body: { url: 'https://example.com' } },
      testContext({ useCompatibilityUserAgentForChecks: true })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: { 'User-Agent': COMPATIBILITY_USER_AGENT },
      })
    );
  });

  it('resolveCheckLinkUserAgent switches modes', () => {
    expect(resolveCheckLinkUserAgent(false)).toBe(LINK_CHECKER_USER_AGENT);
    expect(resolveCheckLinkUserAgent(true)).toBe(COMPATIBILITY_USER_AGENT);
    expect(resolveCheckLinkUserAgent()).toBe(LINK_CHECKER_USER_AGENT);
  });

  it('returns status when fetch succeeds with 404', async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 404, ok: false })
      .mockResolvedValueOnce({ status: 404, ok: false });
    const result = await handler({ body: { url: 'https://example.com/missing' } });
    expect(result).toEqual({ status: 404 });
  });

  it('trims url before validating', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });
    const result = await handler({ body: { url: '  https://example.com  ' } });
    expect(result).toEqual({ status: 200 });
    expect(mockFetch).toHaveBeenCalledWith('https://example.com', expect.any(Object));
  });

  it('returns error when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ error: 'Network error' });
  });

  it('logs the HEAD method when the GET fallback is discarded', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockFetch
      .mockResolvedValueOnce({ status: 403, ok: false, url: 'https://example.com' })
      .mockResolvedValueOnce({ status: 503, ok: false, url: 'https://example.com' });
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ status: 403 });
    expect(JSON.parse(logSpy.mock.calls[0][0])).toMatchObject({ method: 'HEAD', status: 403 });
    logSpy.mockRestore();
  });

  it('strips query strings from logged urls', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      url: 'https://example.com/final?token=secret',
    });
    await handler({ body: { url: 'https://example.com/page?sig=secret#frag' } });
    const logged = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logged).toMatchObject({
      url: 'https://example.com/page',
      responseUrl: 'https://example.com/final',
    });
    expect(logSpy.mock.calls[0][0]).not.toContain('secret');
    logSpy.mockRestore();
  });

  it('returns generic error when fetch throws non-Error', async () => {
    mockFetch.mockRejectedValueOnce('string error');
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ error: 'Request failed' });
  });
});
