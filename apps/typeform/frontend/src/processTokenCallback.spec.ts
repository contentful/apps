import { vi } from 'vitest';
import processTokenCallback from './processTokenCallback';

// The app's deployed origin, per `apps/typeform/lambda/config/serverless-env.prd.yml`.
const APP_ORIGIN = 'https://typeform.ctfapps.net';

function mockWindow(href: string) {
  return {
    location: { href },
    opener: { postMessage: vi.fn() },
    history: { replaceState: vi.fn() },
  };
}

describe('processTokenCallback', () => {
  beforeEach(() => {
    Date.now = vi.fn(() => 0);
  });

  it('posts the token scoped to the app origin, never to a wildcard', () => {
    const window = mockWindow(`${APP_ORIGIN}/frontend/?token=abc123&expiresIn=10`);

    processTokenCallback(window as any);

    expect(window.opener.postMessage).toHaveBeenCalledWith(
      { token: 'abc123', expireTime: 10000 },
      APP_ORIGIN
    );
    expect(window.history.replaceState).toHaveBeenCalledWith({}, 'oauth', '/');
  });

  it('falls back to the default expiration when expiresIn is missing', () => {
    const window = mockWindow(`${APP_ORIGIN}/frontend/?token=abc123`);

    processTokenCallback(window as any);

    expect(window.opener.postMessage).toHaveBeenCalledWith(
      { token: 'abc123', expireTime: 604800000 },
      APP_ORIGIN
    );
  });

  it('posts an error from the query string scoped to the app origin', () => {
    const window = mockWindow(`${APP_ORIGIN}/frontend/?error=nope`);

    processTokenCallback(window as any);

    expect(window.opener.postMessage).toHaveBeenCalledWith({ error: 'nope' }, APP_ORIGIN);
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });

  it('posts an error scoped to the app origin when there is no query string', () => {
    const window = mockWindow(`${APP_ORIGIN}/frontend/`);

    processTokenCallback(window as any);

    expect(window.opener.postMessage).toHaveBeenCalledWith(
      { error: 'No query string provided!' },
      APP_ORIGIN
    );
  });

  it('derives the target origin from the callback URL rather than hardcoding one', () => {
    const window = mockWindow('http://localhost:3000/frontend/?token=abc123&expiresIn=10');

    processTokenCallback(window as any);

    expect(window.opener.postMessage).toHaveBeenCalledWith(
      { token: 'abc123', expireTime: 10000 },
      'http://localhost:3000'
    );
  });
});
