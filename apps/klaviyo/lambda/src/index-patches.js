const exchangeAuthCode = async (code, codeVerifier, clientId, clientSecret, redirectUri) => {
  try {
    console.log('Exchanging auth code for token with params:', {
      code_length: code.length,
      clientId_first_chars: clientId.substring(0, 5) + '...',
      redirectUri,
    });

    // OAuth requires form-encoded data for token exchange
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('code_verifier', codeVerifier);
    params.append('redirect_uri', redirectUri);

    // Basic auth requires Base64 encoding of client_id:client_secret
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('Making request to Klaviyo token endpoint', params);

    const response = await axios.post(KLAVIYO_AUTH_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
    });

    console.log('Token exchange successful');
    return response.data;
  } catch (error) {
    console.error('Error exchanging auth code:', error.response?.data || error.message);
    if (error.response && error.response.data) {
      console.error('Klaviyo error details:', error.response.data);
    }
    throw error;
  }
};
