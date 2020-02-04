export default (window: Window) => {
  const { searchParams, search } = new URL(window.location.href);

  if (search.length) {
    const error = searchParams.get('error');

    if (error) {
      window.opener.postMessage({ error }, '*');
      return;
    }

    const token = searchParams.get('token') || '';
    const expiresIn = parseInt(searchParams.get('expiresIn') || '', 10) || 3200;

    const expireTime = Date.now() + expiresIn * 1000;

    window.localStorage.setItem('token', token);
    window.localStorage.setItem('expireTime', expireTime.toString());
    window.opener.postMessage({ token }, '*');

    window.history.replaceState({}, 'oauth', '/');
  } else {
    window.opener.postMessage({ error: 'No query string provided!' }, '*');
  }
};
