import { MarketoAuthenticationError } from './exceptions';
import { INVALID_CREDENTIALS_RESPONSE, INVALID_MUNCHKIN_RESPONSE } from '../src/const';

export type MarketoAuthResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

export async function getMarketoToken(
  clientId: string,
  clientSecret: string,
  munchkinId: string
): Promise<MarketoAuthResponse> {
  const authUrl = `https://${munchkinId}.mktorest.com/identity/oauth/token?${new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }).toString()}`;

  const authResponse = await fetch(authUrl);

  if (!authResponse.ok) {
    let message = INVALID_CREDENTIALS_RESPONSE;

    try {
      const errorBody = (await authResponse.json()) as {
        error?: string;
        error_description?: string;
      };

      if (errorBody?.error_description) {
        message = `Marketo authentication failed: ${errorBody.error_description}`;
      }
    } catch {
      // if the munchkin id is invalid, the response will not be parsed as JSON
      message = INVALID_MUNCHKIN_RESPONSE;
    }

    throw new MarketoAuthenticationError(message);
  }

  const auth = (await authResponse.json()) as MarketoAuthResponse;

  if (!auth.access_token) {
    throw new MarketoAuthenticationError(INVALID_CREDENTIALS_RESPONSE);
  }

  return auth;
}
