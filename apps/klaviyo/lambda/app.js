const AWS = require('aws-sdk');
const axios = require('axios');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

const OAUTH_STATE_TABLE = process.env.OAUTH_STATE_TABLE || 'KlaviyoOAuthState';

// Klaviyo API URLs
const KLAVIYO_API_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_AUTH_URL = 'https://a.klaviyo.com/oauth/token';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://65be623a-05f8-4d97-8178-e5936fd725a4.ctfcloud.net',
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Origin,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Allow-Credentials': true,
};

console.log('DynamoDB setup');
const dbClient = new DynamoDBClient({});
console.log('DynamoDB client created');
const docClient = DynamoDBDocumentClient.from(dbClient);
console.log('DynamoDB document client created');

// Response formatter
const formatResponse = (statusCode, body, headers = {}) => {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...headers,
    },
    body: JSON.stringify(body),
  };
  console.log('Formatted response:', {
    statusCode,
    headers: response.headers,
    body: body,
  });
  return response;
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

const updateSyncStatus = async (entryId, contentTypeId, contentTypeName) => {
  console.log('Updating sync status for entry', entryId, contentTypeId, contentTypeName);
  // TODO: update the sync status for the entry
};

// Utility to generate a random state string
const generateState = () =>
  [...Array(32)].map(() => Math.floor(Math.random() * 36).toString(36)).join('');

// Persistent state helpers
async function storeOAuthState(
  state,
  clientId,
  clientSecret,
  redirectUri,
  codeChallenge,
  codeChallengeMethod
) {
  console.log('Storing OAuth state:', {
    state,
    clientId_first_chars: clientId?.substring(0, 5) + '...',
    redirectUri,
    codeChallenge,
    codeChallengeMethod,
  });
  try {
    await docClient.send(
      new PutCommand({
        TableName: OAUTH_STATE_TABLE,
        Item: {
          state,
          clientId,
          clientSecret,
          redirectUri,
          codeChallenge,
          codeChallengeMethod,
          createdAt: Date.now(),
        },
      })
    );
  } catch (err) {
    console.error('Error storing OAuth state in DynamoDB:', err);
    throw err;
  }
}

async function getAndDeleteOAuthState(state) {
  console.log('Retrieving OAuth state for:', state);
  const res = await docClient.send(
    new GetCommand({
      TableName: OAUTH_STATE_TABLE,
      Key: { state },
    })
  );
  console.log('Retrieved state data:', res.Item ? 'Found' : 'Not found');
  if (res.Item) {
    await docClient.send(
      new DeleteCommand({
        TableName: OAUTH_STATE_TABLE,
        Key: { state },
      })
    );
    console.log('Deleted state data after retrieval');
    return res.Item;
  }
  return null;
}

// Main Lambda handler
exports.handler = async (event) => {
  console.log('--- Incoming Request ---');
  console.log('Event:', event);
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
    // Handle OAuth authorize endpoint
    if (event.path === '/auth/authorize' && event.httpMethod === 'GET') {
      const clientId = event.queryStringParameters?.client_id || process.env.KLAVIYO_CLIENT_ID;
      const redirectUri =
        event.queryStringParameters?.redirect_uri || process.env.KLAVIYO_REDIRECT_URI;
      const clientSecret =
        event.queryStringParameters?.client_secret || process.env.KLAVIYO_CLIENT_SECRET;
      const codeChallenge = event.queryStringParameters?.code_challenge;
      const codeChallengeMethod = event.queryStringParameters?.code_challenge_method;
      const state = generateState();

      console.log('Authorize endpoint received params:', {
        hasClientId: !!clientId,
        clientId_first_chars: clientId?.substring(0, 5) + '...',
        redirectUri,
        hasClientSecret: !!clientSecret,
        clientSecret_first_chars: clientSecret?.substring(0, 5) + '...',
        hasCodeChallenge: !!codeChallenge,
        codeChallengeMethod,
        state,
        stateLength: state.length,
        queryParams: event.queryStringParameters,
      });

      // Store all values for use in callback (persistently)
      console.log('About to store OAuth state in DynamoDB');
      await storeOAuthState(
        state,
        clientId,
        clientSecret,
        redirectUri,
        codeChallenge,
        codeChallengeMethod
      );
      console.log('Successfully stored OAuth state in DynamoDB');

      // Klaviyo requires specific scopes
      const scopes = [
        'accounts:read',
        'accounts:write',
        'profiles:read',
        'profiles:write',
        'metrics:read',
        'metrics:write',
        'events:read',
        'events:write',
        'templates:read',
        'templates:write',
      ].join(' ');

      const url = `https://www.klaviyo.com/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
        clientId
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(
        scopes
      )}&state=${encodeURIComponent(state)}&code_challenge_method=${encodeURIComponent(
        codeChallengeMethod
      )}&code_challenge=${encodeURIComponent(codeChallenge)}`;

      console.log('About to return 302 redirect to Klaviyo with URL:', url);
      return {
        statusCode: 302,
        headers: { Location: url, ...corsHeaders },
        body: '',
      };
    }

    // Handle OAuth callback endpoint
    if (
      event.path === '/auth/callback' &&
      (event.httpMethod === 'GET' || event.httpMethod === 'POST')
    ) {
      console.log('Callback endpoint hit with method:', event.httpMethod);
      console.log('Request headers:', event.headers);
      console.log('Request body:', event.body);
      console.log('Query parameters:', event.queryStringParameters);

      let code, state, code_verifier, error, error_description, params;

      try {
        if (event.httpMethod === 'POST') {
          console.log('Processing POST request body:', event.body);
          params = JSON.parse(event.body || '{}');
        } else {
          params = event.queryStringParameters || {};
        }

        code = params.code;
        state = params.state;
        code_verifier = params.code_verifier;
        error = params.error;
        error_description = params.error_description;

        console.log('Parsed callback parameters:', {
          hasCode: !!code,
          state,
          hasCodeVerifier: !!code_verifier,
          hasError: !!error,
          error_description,
        });

        // Retrieve client info from DynamoDB
        let clientId, clientSecret, redirectUri;
        if (state) {
          console.log('Retrieving state from DynamoDB:', state);
          const stateData = await getAndDeleteOAuthState(state);
          if (stateData) {
            clientId = stateData.clientId;
            clientSecret = stateData.clientSecret;
            redirectUri = stateData.redirectUri.split('?')[0];
            console.log('Retrieved state data:', {
              hasClientId: !!clientId,
              hasClientSecret: !!clientSecret,
              redirectUri,
            });
          }
        }

        // Fallback to query params or env
        clientId = clientId || params.client_id || process.env.KLAVIYO_CLIENT_ID;
        clientSecret = clientSecret || params.client_secret || process.env.KLAVIYO_CLIENT_SECRET;
        redirectUri =
          redirectUri || params.redirect_uri?.split('?')[0] || process.env.KLAVIYO_REDIRECT_URI;

        if (!state || !clientId || !clientSecret || !redirectUri) {
          console.error('Missing required parameters:', {
            hasState: !!state,
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasRedirectUri: !!redirectUri,
          });
          return formatResponse(400, {
            error: 'Invalid or missing state/client info',
            details: {
              hasState: !!state,
              hasClientId: !!clientId,
              hasClientSecret: !!clientSecret,
              hasRedirectUri: !!redirectUri,
            },
          });
        }

        if (error) {
          console.error('OAuth error:', { error, error_description });
          return formatResponse(400, { error, error_description });
        }

        if (!code) {
          console.error('Missing authorization code');
          return formatResponse(400, { error: 'Missing authorization code' });
        }

        if (!code_verifier) {
          console.error('Missing code_verifier for PKCE');
          return formatResponse(400, { error: 'Missing code_verifier for PKCE token exchange' });
        }

        // Exchange code for access token
        try {
          console.log('Exchanging code for token...');
          const tokenData = await exchangeAuthCode(
            code,
            code_verifier,
            clientId,
            clientSecret,
            redirectUri
          );

          console.log('Token exchange successful');
          return formatResponse(200, {
            access_token: tokenData.access_token,
            ...tokenData,
          });
        } catch (err) {
          console.error('Token exchange failed:', err);
          return formatResponse(500, {
            error: 'Token Exchange Failed',
            details: err.message,
            response: err.response?.data,
          });
        }
      } catch (err) {
        console.error('Callback processing error:', err);
        return formatResponse(500, {
          error: 'Internal server error',
          details: err.message,
        });
      }
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

          // Proxy the request to the Klaviyo API
          const method = event.httpMethod.toLowerCase() || 'get';
          console.log(
            'sending request to',
            `https://a.klaviyo.com/api/${endpoint}`,
            'with data',
            data,
            'and accessToken',
            accessToken
          );
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
