const DEFAULT_TOKEN_EXPIRATION_TIME = 604800;

const processTokenCallback = (window: Window) => {
  const { searchParams, search } = new URL(window.location.href);

  if (search.length) {
    const error = searchParams.get('error');

    if (error) {
      window.opener.postMessage({ error }, '*');
      return;
    }

    const token = searchParams.get('token') || '';
    const expiresIn =
      parseInt(searchParams.get('expiresIn') || '', 10) || DEFAULT_TOKEN_EXPIRATION_TIME;

    const expireTime = Date.now() + expiresIn * 1000;

    window.opener.postMessage({ token, expireTime }, '*');

    window.history.replaceState({}, 'oauth', '/');
  } else {
    window.opener.postMessage({ error: 'No query string provided!' }, '*');
  }
};
export default processTokenCallback;
