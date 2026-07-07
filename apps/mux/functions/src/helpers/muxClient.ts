const MUX_API_BASE = 'https://api.mux.com';

interface MuxCredentials {
  tokenId: string;
  tokenSecret: string;
}

export async function muxFetch(
  credentials: MuxCredentials,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  body?: string
): Promise<Response> {
  const encoded = btoa(`${credentials.tokenId}:${credentials.tokenSecret}`);

  return fetch(`${MUX_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
      'x-source-platform': 'contentful',
    },
    body,
  });
}
