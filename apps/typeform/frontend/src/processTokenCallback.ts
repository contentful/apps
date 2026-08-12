const DEFAULT_TOKEN_EXPIRATION_TIME = 604800;

const processTokenCallback = (window: Window) => {
  // The callback and the config screen that opened it share an origin, so the
  // callback URL's own origin is the one to scope the token message to.
  const { searchParams, search, origin } = new URL(window.location.href);

  if (search.length) {
    const error = searchParams.get('error');

    if (error) {
      window.opener.postMessage({ error }, origin);
      return;
    }

    const token = searchParams.get('token') || '';
    const expiresIn =
      parseInt(searchParams.get('expiresIn') || '', 10) || DEFAULT_TOKEN_EXPIRATION_TIME;

    const expireTime = Date.now() + expiresIn * 1000;

    window.opener.postMessage({ token, expireTime }, origin);

    window.history.replaceState({}, 'oauth', '/');
  } else {
    window.opener.postMessage({ error: 'No query string provided!' }, origin);
  }
};
export default processTokenCallback;
