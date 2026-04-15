import { handler } from '../../functions/checkLink';
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
    mockFetch.mockResolvedValueOnce({ status: 200, ok: true });
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ status: 200 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        method: 'HEAD',
        redirect: 'follow',
      })
    );
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

  it('returns generic error when fetch throws non-Error', async () => {
    mockFetch.mockRejectedValueOnce('string error');
    const result = await handler({ body: { url: 'https://example.com' } });
    expect(result).toEqual({ error: 'Request failed' });
  });
});
