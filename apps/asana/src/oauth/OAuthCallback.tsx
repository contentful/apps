import { useEffect } from 'react';

/**
 * Rendered when Asana redirects the OAuth popup back to this app's own
 * hosted URL. This runs outside the Contentful iframe (Asana's redirect is a
 * top-level navigation, not something Contentful routes), so there's no SDK
 * here — its only job is handing `code`/`state` back to the opener window
 * that started the flow, which does have SDK/CMA access.
 */
const OAuthCallback = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    window.opener?.postMessage(
      {
        source: 'asana-oauth-callback',
        code: params.get('code'),
        state: params.get('state'),
        error: params.get('error'),
      },
      window.location.origin
    );
    window.close();
  }, []);

  return <p>Connecting to Asana…</p>;
};

export default OAuthCallback;
