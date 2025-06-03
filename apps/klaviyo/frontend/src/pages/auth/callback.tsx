import { useEffect, useState } from 'react';

// Use the same domain as the callback URL
const BACKEND_CALLBACK_URL = 'http://localhost:3001/auth/callback';

const Callback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const codeVerifier = sessionStorage.getItem('klaviyo_pkce_code_verifier');

        if (!code || !state || !codeVerifier) {
          setError('Missing required parameters');
          return;
        }

        // First try POST request
        try {
          const response = await fetch(BACKEND_CALLBACK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ code, state, code_verifier: codeVerifier }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to exchange code');
          }

          const data = await response.json();

          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'klaviyo_oauth_token',
                token: data.access_token,
                state,
              },
              window.location.origin
            );
          }
          window.close();
        } catch (postError) {
          console.log('POST request failed, trying GET request:', postError);
          // If POST fails, try GET request
          const response = await fetch(`${BACKEND_CALLBACK_URL}?${params.toString()}`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to exchange code');
          }

          const data = await response.json();

          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'klaviyo_oauth_token',
                token: data.access_token,
                state,
              },
              window.location.origin
            );
          }
          window.close();
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Completing authentication...</h2>
      <p>Please wait while we complete the authentication process.</p>
    </div>
  );
};

export default Callback;
