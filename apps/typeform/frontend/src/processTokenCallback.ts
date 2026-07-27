const DEFAULT_TOKEN_EXPIRATION_TIME = 604800;

const processTokenCallback = (window: Window) => {
  const { searchParams, search, origin } = new URL(window.location.href);

  // The OAuth callback is served from the same origin as the config screen that
  // opened it, so scope the message to that origin instead of broadcasting the
  // token to whatever origin the opener happens to be on.
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
