// PKCE utility for Klaviyo OAuth
// https://developers.klaviyo.com/en/docs/set_up_oauth

function base64URLEncode(str: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return base64URLEncode(array.buffer);
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(digest);
}
