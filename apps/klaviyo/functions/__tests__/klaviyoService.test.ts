import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KlaviyoService } from '../klaviyoService';

function buildOauthSdk(token: any) {
  return { token: vi.fn().mockResolvedValue(token) } as any;
}

describe('KlaviyoService.makeRequest token handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('does not log the Authorization header when the Klaviyo API returns a non-OK response', async () => {
    const secretToken = 'super-secret-access-token';
    const oauthSdk = buildOauthSdk({ accessToken: secretToken });
    const service = new KlaviyoService(oauthSdk);

    (global.fetch as any) = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('{"errors":[{"detail":"boom"}]}'),
    });

    await expect(
      (service as any).makeRequest('GET', 'template-universal-content')
    ).rejects.toThrow();

    const allLoggedArgs = consoleErrorSpy.mock.calls.flat();
    for (const arg of allLoggedArgs) {
      const serialized = JSON.stringify(arg);
      expect(serialized).not.toContain(secretToken);
      expect(serialized).not.toContain('Authorization');
    }
  });

  it('does not log the raw token value when the OAuth SDK returns an unrecognized token shape', async () => {
    const secretToken = 'unexpected-shape-secret-value';
    const oauthSdk = buildOauthSdk({ notAToken: secretToken });
    const service = new KlaviyoService(oauthSdk);

    (global.fetch as any) = vi.fn();

    await expect((service as any).makeRequest('GET', 'template-universal-content')).rejects.toThrow(
      'Invalid token format received from OAuth SDK'
    );

    expect(global.fetch).not.toHaveBeenCalled();

    const allLoggedArgs = consoleErrorSpy.mock.calls.flat();
    for (const arg of allLoggedArgs) {
      const serialized = JSON.stringify(arg);
      expect(serialized).not.toContain(secretToken);
    }
  });

  it('still logs response status, body, and URL on a non-OK response (fix should not swallow debugging info)', async () => {
    const oauthSdk = buildOauthSdk({ accessToken: 'token' });
    const service = new KlaviyoService(oauthSdk);

    (global.fetch as any) = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: vi.fn().mockResolvedValue('service unavailable'),
    });

    await expect(
      (service as any).makeRequest('GET', 'template-universal-content')
    ).rejects.toThrow();

    const allLoggedArgs = consoleErrorSpy.mock.calls.flat().map((arg) => JSON.stringify(arg));
    expect(allLoggedArgs.some((arg) => arg.includes('503'))).toBe(true);
    expect(allLoggedArgs.some((arg) => arg.includes('service unavailable'))).toBe(true);
  });
});
