export const isDev = process.env.NODE_ENV === 'development';

export const NETLIFY_CLIENT_ID = isDev
  ? '7b5030d1f1c2c4e97c1c5f10b746ca17b41c511310b3ff2fc446f358f599b93f'
  : '83307e7b9c33406c2fb0fc69a61705189d130da28e7d99d42f01f22996341764';
export const NETLIFY_REDIRECT_URI = isDev
  ? 'http://localhost:1234/auth'
  : 'https://knowledge-base.ctfapps.net/auth';
export const NETLIFY_API_URL = 'https://api.netlify.com/api/v1';
export const NETLIFY_AUTH_URL = 'https://app.netlify.com/authorize';
