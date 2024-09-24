import type { ImportMeta } from '../vite-env.d.ts';

let LAMBDA_URI = 'https://api.jira.ctfapps.net';
let CLIENT_ID = 'XD9k9QU9VT4Rt26u6lbO3NM0fOqvvXan';
const env = (import.meta as unknown as ImportMeta).env;
if (process.env.NODE_ENV === 'development') {
  LAMBDA_URI = `${env.REACT_APP_NGROK_URL}/test`;
  CLIENT_ID = env.REACT_APP_ATLASSIAN_APP_CLIENT_ID || '';
}

const constants = {
  OAUTH_REDIRECT_URI: `${LAMBDA_URI}/auth`,
  CONNECT_URL: `${LAMBDA_URI}/connect.json`,
  CLIENT_ID,
};
export default constants;
