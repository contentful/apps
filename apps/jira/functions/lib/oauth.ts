import { APIGatewayProxyEvent } from 'aws-lambda'
import { SecretsManager } from 'aws-sdk'
import fetch from 'node-fetch'
import { getEnvVarOrThrow } from './helpers'
import { HTTPResponse } from './lambda'

interface JiraResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  refresh_token: string
}

interface OauthCredentials {
  clientId: string
  clientSecret: string
}

let credentialsCache: OauthCredentials | undefined

/** Request an oauth token from the Jira client using an exchange code
 * @argument oauthCode The code from the Jira oauth dance, exchanged for an access_token
 */
async function requestOauth(
  code: string,
  redirectUri: string,
  tokenExchangeEndpoint: string,
  oauthCredentials: OauthCredentials
): Promise<JiraResponse> {
  const response = await fetch(tokenExchangeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: oauthCredentials.clientId,
      client_secret: oauthCredentials.clientSecret,
      code,
      redirect_uri: redirectUri
    })
  })

  if (response.status !== 200) {
    console.error(
      'Atlassian token exchange failed, got response:',
      response.status,
      await response.text()
    )
    throw new Error('Atlassian token exchange failed')
  }

  return response.json()
}

const makeFailureResponse = (frontendUrl: string, errorMesage: string) => ({
  statusCode: 302,
  headers: {
    Location: `${frontendUrl}?error=${encodeURIComponent(errorMesage)}`
  }
})

export const handleOauthTokenExchange = async (
  code: string,
  redirectUri: string,
  tokenExchangeEndpoint: string,
  frontendUrl: string,
  oauthCredentials: OauthCredentials
): Promise<HTTPResponse> => {
  try {
    const { access_token, expires_in } = await requestOauth(
      code,
      redirectUri,
      tokenExchangeEndpoint,
      oauthCredentials
    )

    if (!access_token) {
      return makeFailureResponse(frontendUrl, 'OAuth handshake failed')
    }

    return {
      statusCode: 302,
      headers: {
        Location: `${frontendUrl}?token=${access_token}&expiresIn=${expires_in}`
      }
    }
  } catch (err) {
    return makeFailureResponse(frontendUrl, 'OAuth handshake failed')
  }
}

export const getOauthCredentials = async (
  secretId: string,
  secretsManagerClient: SecretsManager
) => {
  if (credentialsCache) {
    return credentialsCache
  }

  const value = await secretsManagerClient
    .getSecretValue({
      SecretId: secretId
    })
    .promise()

  const { clientId, clientSecret } = JSON.parse(value.SecretString || '{}')

  if (!clientId || !clientSecret) {
    throw new Error('OAuth credentials configuration missing')
  }

  credentialsCache = { clientId, clientSecret }
  return credentialsCache
}

export const handleOauthLambdaEvent = (secretsManagerClient: SecretsManager) => async (
  event: APIGatewayProxyEvent
): Promise<HTTPResponse> => {
  if (!event.queryStringParameters || !event.queryStringParameters.code) {
    return makeFailureResponse(
      getEnvVarOrThrow('FRONTEND_URL'),
      'Did not receive authorization code from Atlassian.'
    )
  } else {
    const { code } = event.queryStringParameters

    const oauthCredentials = await getOauthCredentials(
      getEnvVarOrThrow('OAUTH_CREDENTIALS_SECRET_ID'),
      secretsManagerClient
    )

    return handleOauthTokenExchange(
      code,
      getEnvVarOrThrow('OAUTH_REDIRECT_URI'),
      getEnvVarOrThrow('OAUTH_TOKEN_EXCHANGE_ENDPOINT'),
      getEnvVarOrThrow('FRONTEND_URL'),
      oauthCredentials
    )
  }
}
