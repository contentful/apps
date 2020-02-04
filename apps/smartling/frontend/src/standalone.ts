export default (window: Window) => {
  const { searchParams, search } = new URL(window.location.href);
  window.history.replaceState({}, 'smartling', '/');

  if (search.length) {
    const token = searchParams.get('access_token') || '';
    const refreshToken = searchParams.get('refresh_token') || '';

    window.localStorage.setItem('token', token);
    window.localStorage.setItem('refreshToken', refreshToken);
    window.opener.postMessage({ token, refreshToken }, '*');
  }
};
