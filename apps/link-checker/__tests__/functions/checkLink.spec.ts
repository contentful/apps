import { handler, LINK_CHECKER_USER_AGENT } from '../../functions/checkLink';
import { vi } from 'vitest';

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

  it('sends a User-Agent without the "linkchecker" token some WAFs block', () => {
    expect(LINK_CHECKER_USER_AGENT.toLowerCase()).not.toContain('linkchecker');
    expect(LINK_CHECKER_USER_AGENT).toContain('Contentful-Link-Checker');
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

  it('flags Cloudflare and Vercel bot challenges as challenged', async () => {
    for (const header of ['cf-mitigated', 'x-vercel-mitigated']) {
      const challenge = { status: 403, ok: false, headers: new Headers({ [header]: 'challenge' }) };
      mockFetch.mockReset().mockResolvedValueOnce(challenge).mockResolvedValueOnce(challenge);
      const result = await handler({ body: { url: 'https://example.com' } });
      expect(result).toEqual({ status: 403, challenged: true });
    }
  });

  it('flags an AWS WAF challenge even though it returns 202', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 202,
      ok: true,
      headers: new Headers({ 'x-amzn-waf-action': 'challenge' }),
    });
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ status: 202, challenged: true });
  });

  it('flags an AWS WAF captcha as challenged', async () => {
    const captcha = {
      status: 405,
      ok: false,
      headers: new Headers({ 'x-amzn-waf-action': 'captcha' }),
    };
    mockFetch.mockResolvedValueOnce(captcha).mockResolvedValueOnce(captcha);
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ status: 405, challenged: true });
  });

  it('trusts a clean GET over a challenged HEAD', async () => {
    mockFetch
      .mockResolvedValueOnce({
        status: 403,
        ok: false,
        headers: new Headers({ 'cf-mitigated': 'challenge' }),
      })
      .mockResolvedValueOnce({ status: 200, ok: true, headers: new Headers() });
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ status: 200 });
  });

  it('does not flag a plain 403 as challenged', async () => {
    const forbidden = { status: 403, ok: false, headers: new Headers() };
    mockFetch.mockResolvedValueOnce(forbidden).mockResolvedValueOnce(forbidden);
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ status: 403 });
  });

  it('returns generic error when fetch throws non-Error', async () => {
    mockFetch.mockRejectedValueOnce('string error');
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ error: 'Request failed' });
  });
});
