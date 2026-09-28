const MUX_API_BASE = 'https://api.mux.com';
const MUX_API_HOST = 'api.mux.com';

interface MuxCredentials {
  tokenId: string;
  tokenSecret: string;
}

export function resolveMuxUrl(path: string): URL {
  const url = new URL(path, MUX_API_BASE);
  if (url.host !== MUX_API_HOST) {
    throw new Error(`Invalid Mux API path (resolved to ${url.host})`);
  }
  return url;
}

export async function muxFetch(
  credentials: MuxCredentials,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  body?: string
): Promise<Response> {
  const url = resolveMuxUrl(path);
  const encoded = btoa(`${credentials.tokenId}:${credentials.tokenSecret}`);

  return fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
      'x-source-platform': 'contentful',
    },
    body,
  });
}
