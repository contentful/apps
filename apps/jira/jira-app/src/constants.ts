let LAMBDA_URI = 'https://api.jira.ctfapps.net';
let CLIENT_ID = 'XD9k9QU9VT4Rt26u6lbO3NM0fOqvvXan';

interface ImportMetaValue extends ImportMeta {
  NODE_ENV?: string;
  VITE_NGROK_URL?: string;
  VITE_ATLASSIAN_APP_CLIENT_ID?: string;
}

if ((import.meta as ImportMetaValue).NODE_ENV === 'development') {
  LAMBDA_URI = `${(import.meta as ImportMetaValue).VITE_NGROK_URL}/test`;
  CLIENT_ID = (import.meta as ImportMetaValue).VITE_ATLASSIAN_APP_CLIENT_ID || '';
}

const constants = {
  OAUTH_REDIRECT_URI: `${LAMBDA_URI}/auth`,
  CONNECT_URL: `${LAMBDA_URI}/connect.json`,
  CLIENT_ID,
};
export default constants;
