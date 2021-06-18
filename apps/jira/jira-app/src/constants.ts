let LAMBDA_URI = 'https://api.jira.ctfapps.net';
let CLIENT_ID = 'XD9k9QU9VT4Rt26u6lbO3NM0fOqvvXan';

if (process.env.NODE_ENV === 'development') {
  LAMBDA_URI = `${process.env.NGROK_URL}/dev`;
  CLIENT_ID = process.env.ATLASSIAN_APP_CLIENT_ID || '';
}

const constants = {
  OAUTH_REDIRECT_URI: `${LAMBDA_URI}/auth`,
  CONNECT_URL: `${LAMBDA_URI}/connect.json`,
  CLIENT_ID
};
export default constants
