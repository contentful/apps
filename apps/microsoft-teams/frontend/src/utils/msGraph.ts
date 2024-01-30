import { graphConfig } from '@configs/authConfig';

/**
 * Attaches a given access token to a MS Graph API call. Returns information about the user
 * @param accessToken
 */
export async function callMsGraph(accessToken: string) {
  const headers = new Headers();
  const bearer = `Bearer ${accessToken}`;

  headers.append('Authorization', bearer);

  const options = {
    method: 'GET',
    headers: headers,
  };

  try {
    const res = await fetch(graphConfig.graphMeEndpoint, options);
    return await res.json();
  } catch (error) {
    console.log(error);
  }
}
