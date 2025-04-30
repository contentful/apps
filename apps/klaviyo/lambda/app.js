const axios = require('axios');

// Klaviyo API URLs
const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_AUTH_URL = 'https://a.klaviyo.com/oauth/token';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': true,
};

// Response formatter
const formatResponse = (statusCode, body, headers = {}) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
    body: JSON.stringify(body),
  };
};

// Handle OAuth authorization token exchange
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

// Get OAuth token using client credentials
const getClientCredentialsToken = async (clientId, clientSecret) => {
  try {
    // OAuth requires form-encoded data
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append(
      'scope',
      'profiles:read profiles:write metrics:read metrics:write events:read events:write'
    );

    // Basic auth requires Base64 encoding of client_id:client_secret
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(KLAVIYO_AUTH_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Klaviyo auth token:', error.response?.data || error.message);
    throw error;
  }
};

// Klaviyo API handlers
const trackEvent = async (data, accessToken) => {
  try {
    const response = await axios.post(
      `${KLAVIYO_API_URL}/track`,
      {
        event: data.event,
        customer_properties: data.customerProperties,
        properties: data.properties,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error tracking Klaviyo event:', error);
    throw error;
  }
};

const uploadEvent = async (data, accessToken) => {
  try {
    const response = await axios.post(`${KLAVIYO_API_URL}/template-universal-content`, data, {
      headers: {
        'Content-Type': 'application/json',
        revision: '2025-04-15',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading Klaviyo event:', error);
    throw error;
  }
};

const identifyProfile = async (data, accessToken) => {
  try {
    const response = await axios.post(
      `${KLAVIYO_API_URL}/identify`,
      {
        properties: data.properties,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error identifying Klaviyo profile:', error);
    throw error;
  }
};

// Revoke an OAuth token
const revokeToken = async (token, clientId, clientSecret) => {
  try {
    // Form data for token revocation
    const params = new URLSearchParams();
    params.append('token', token);

    // Basic auth for revocation
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post('https://a.klaviyo.com/oauth/revoke', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error revoking token:', error.response?.data || error.message);
    throw error;
  }
};

// Parse query parameters for auth callback handling
const parseQueryString = (url) => {
  const params = {};
  const queryString = url.split('?')[1];
  if (!queryString) return params;

  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    params[key] = decodeURIComponent(value || '');
  }

  return params;
};

const updateSyncStatus = async (entryId, contentTypeId, contentTypeName) => {
  console.log('Updating sync status for entry', entryId, contentTypeId, contentTypeName);
  // TODO: update the sync status for the entry
};

// Define allowlist of permitted endpoints
const ALLOWED_ENDPOINTS = [
  'template-universal-content',
  'images',
  'profiles',
  'metrics',
  'lists',
  'campaigns',
  // Add other valid endpoints your app needs
];

// Main Lambda handler
exports.handler = async (event) => {
  console.log('--- Incoming Request ---');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', event.headers);
  console.log('Body:', event.body);
  console.log('------------------------');

  // Handle preflight OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Handle app events for entry changes
    if (event.path === '/api/klaviyo/entry-changes' && event.httpMethod === 'POST') {
      console.log('Processing entry change event', event.body);
      // update the sync status for the entry
      const body = JSON.parse(event.body || '{}');
      const entryId = body.sys.entryId;
      const contentTypeId = body.sys.contentType.sys.id;
      const contentTypeName = body.sys.contentType.sys.id;
      await updateSyncStatus(entryId, contentTypeId, contentTypeName);
    }

    // Handle OAuth callback endpoint
    if (event.path === '/auth/callback' && event.httpMethod === 'GET') {
      console.log('Processing OAuth callback');
      const params = event.queryStringParameters || {};
      const { code, state, error, error_description } = params;

      if (!code) {
        return formatResponse(400, { error: 'Missing authorization code' });
      }

      // Instead of trying to use localStorage on the server (which doesn't exist),
      // return an HTML page that will handle retrieving credentials from localStorage
      // in the browser and exchanging the code for tokens
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Klaviyo Authorization</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
          .container { max-width: 600px; margin: 0 auto; }
          .success { color: #28a745; }
          .error { color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${error ? 'Authorization Failed' : 'Authorization Successful'}</h2>
          <p class="${error ? 'error' : 'success'}">${
        error
          ? `Error: ${error} - ${error_description || ''}`
          : 'You can close this window and return to Contentful.'
      }</p>
          <p id="status">Communicating with Contentful...</p>
        </div>
        <script>
          // Try to get PKCE data from parent window
          if (window.opener) {
            try {
              // Request PKCE data from parent
              window.opener.postMessage({ type: 'KLAVIYO_GET_PKCE' }, '*');
              
              // Listen for response with PKCE data
              window.addEventListener('message', function(event) {
                if (event.data && event.data.type === 'KLAVIYO_PKCE_DATA' && event.data.pkceData) {
                  console.log('Received PKCE data from parent');
                  // Store PKCE data in this window's localStorage
                  localStorage.setItem('klaviyo_pkce_data', event.data.pkceData);
                }
              });
            } catch (e) {
              console.error('Error getting PKCE data from parent:', e);
            }
          }
          
          // Log localStorage to help troubleshoot
          console.log('Current localStorage keys:', Object.keys(localStorage).filter(key => key.includes('klaviyo')));
          
          // Function to send message to parent window
          function sendMessageToParent() {
            console.log('Attempting to send message to parent window');
            
            const messageData = { 
              type: 'KLAVIYO_AUTH_CALLBACK', 
              code: ${code ? `'${code}'` : 'null'},
              state: ${state ? `'${state}'` : 'null'},
              error: ${error ? `'${error}'` : 'null'},
              error_description: ${error_description ? `'${error_description}'` : 'null'}
            };
            
            console.log('Message data:', messageData);
            
            if (window.opener) {
              try {
                window.opener.postMessage(messageData, '*');
                document.getElementById('status').innerText = 'Message sent to Contentful. This window will close shortly...';
                console.log('Message sent successfully');
                setTimeout(() => window.close(), 2000);
              } catch (err) {
                console.error('Error sending message:', err);
                document.getElementById('status').innerText = 'Error sending message to Contentful. Please close this window and check the app.';
              }
            } else {
              console.error('No opener window found');
              document.getElementById('status').innerText = 'No parent window found. Please close this window and check the app.';
            }
          }
          
          // Try to send message when the page loads
          window.onload = function() {
            // Wait a moment to ensure the parent window is ready
            setTimeout(sendMessageToParent, 500);
          };
          
          // Also try sending immediately
          try {
            sendMessageToParent();
          } catch (e) {
            console.error('Immediate send failed:', e);
          }
        </script>
      </body>
      </html>
    `;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders,
        },
        body: html,
      };
    }

    // Handle auth code exchange with credentials from body
    if (event.path === '/api/klaviyo/proxy/auth/exchange-code' && event.httpMethod === 'POST') {
      console.log('Processing code exchange');
      const body = JSON.parse(event.body || '{}');
      const {
        code,
        code_verifier: codeVerifier,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      } = body;
      console.log('code', code);
      console.log('codeVerifier', codeVerifier);
      console.log('clientId', clientId);
      console.log('clientSecret', clientSecret);
      console.log('redirectUri', redirectUri);

      if (!code || !clientId || !clientSecret || !redirectUri) {
        return formatResponse(400, { error: 'Missing required parameters' });
      }

      try {
        const tokenData = await exchangeAuthCode(
          code,
          codeVerifier,
          clientId,
          clientSecret,
          redirectUri
        );
        console.log('tokenData', tokenData);
        return formatResponse(200, tokenData);
      } catch (error) {
        console.error('Error exchanging code:', error);
        return formatResponse(error.response?.status || 500, {
          error: 'Failed to exchange code',
          details: error.response?.data || error.message,
        });
      }
    }

    if (event.path === '/api/klaviyo/proxy/oauth/token') {
      console.log('Processing OAuth token refresh request');
      const body = JSON.parse(event.body || '{}');
      const {
        grant_type: grantType,
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      } = body;

      if (!grantType || !refreshToken || !clientId || !clientSecret) {
        return formatResponse(400, {
          error: 'Missing required fields for token refresh',
          details: {
            grantType,
            hasRefreshToken: !!refreshToken,
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
          },
        });
      }

      try {
        // OAuth requires form-encoded data
        const params = new URLSearchParams();
        params.append('grant_type', grantType);
        params.append('refresh_token', refreshToken);

        // Basic auth requires Base64 encoding of client_id:client_secret
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await axios.post(KLAVIYO_AUTH_URL, params, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${auth}`,
          },
        });

        return formatResponse(200, response.data);
      } catch (error) {
        console.error('Error refreshing token:', error.response?.data || error.message);
        return formatResponse(error.response?.status || 500, {
          error: 'Failed to refresh token',
          details: error.response?.data || error.message,
        });
      }
    }

    // Handle token revocation endpoint
    if (event.path === '/api/klaviyo/proxy/oauth/revoke') {
      console.log('Processing OAuth revoke request');
      const body = JSON.parse(event.body || '{}');
      const { client_id: clientId, client_secret: clientSecret, token } = body;

      if (!clientId || !clientSecret || !token) {
        return formatResponse(400, { error: 'Missing required fields for token revocation' });
      }

      try {
        await revokeToken(token, clientId, clientSecret);
        return formatResponse(200, { success: true, message: 'Token revoked successfully' });
      } catch (error) {
        return formatResponse(error.response?.status || 500, {
          error: 'Failed to revoke token',
          details: error.response?.data || error.message,
        });
      }
    }

    // Handle standard API proxy request
    if (event.path === '/api/klaviyo/proxy' || event.path.startsWith('/api/klaviyo/proxy/')) {
      console.log(`Processing proxy request to: ${event.path}`);
      const body = JSON.parse(event.body || '{}');
      const action = body.action ? body.action : 'upload';
      const {
        data,
        client_id: clientId,
        client_secret: clientSecret,
        authorization: bearerToken,
      } = body;
      console.log('clientId', clientId);
      console.log('clientSecret', clientSecret);
      console.log('bearerToken', bearerToken);
      console.log('action', action);
      console.log('data', data);

      // Check for auth credentials
      if ((!clientId || !clientSecret) && !bearerToken) {
        return formatResponse(400, { error: 'Missing authentication credentials' });
      }

      try {
        // Get OAuth token
        const accessToken = bearerToken
          ? bearerToken.split(' ')[1]
          : await getClientCredentialsToken(clientId, clientSecret);

        // If it's a standard proxy endpoint
        if (event.path === '/api/klaviyo/proxy') {
          // Route to appropriate handler
          let result;
          console.log('The action is', action);
          switch (action) {
            case 'track':
              result = await trackEvent(data, accessToken);
              break;
            case 'identify':
              result = await identifyProfile(data, accessToken);
              break;
            case 'upload':
              result = await uploadEvent(data, accessToken);
              break;
            default:
              return formatResponse(400, { error: 'Invalid action' });
          }

          return formatResponse(200, { success: true, data: result });
        }
        // If it's a custom API endpoint
        else {
          const endpoint = event.path.replace('/api/klaviyo/proxy/', '');

          // Validate endpoint against allowlist
          const baseEndpoint = endpoint.split('/')[0]; // Get the first part of the path
          if (!ALLOWED_ENDPOINTS.includes(baseEndpoint)) {
            return formatResponse(403, {
              error: 'Forbidden',
              message: 'The requested endpoint is not allowed',
            });
          }

          // Proceed with validated endpoint
          const method = event.httpMethod.toLowerCase() || 'get';
          const response = await axios({
            method,
            url: `https://a.klaviyo.com/api/${endpoint}`,
            data: { data } || {},
            headers: {
              'Content-Type': 'application/json',
              revision: '2025-04-15',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          return formatResponse(200, { success: true, data: response.data });
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          return formatResponse(403, {
            error: 'Authentication failed. Check your client ID and secret.',
          });
        }
        throw error;
      }
    }

    // Default response for unknown endpoints
    return formatResponse(404, { error: 'Endpoint not found', path: event.path });
  } catch (error) {
    console.error('Lambda error:', error);
    return formatResponse(500, { error: 'Internal server error', details: error.message });
  }
};
