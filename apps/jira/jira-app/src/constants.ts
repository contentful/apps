/* global process */

let LAMBDA_URI = 'https://api.jira.ctfapps.net';
let CLIENT_ID = 'XD9k9QU9VT4Rt26u6lbO3NM0fOqvvXan';

if (process.env.nodeEnv === 'development') {
  LAMBDA_URI = 'https://3stl3nxvfh.execute-api.us-east-1.amazonaws.com/dev';
  CLIENT_ID = 'WU0EYJMcTeeFdJRVNABy3h7adB576hDW';
}

export default {
  OAUTH_REDIRECT_URI: `${LAMBDA_URI}/auth`,
  CONNECT_URL: `${LAMBDA_URI}/connect.json`,
  CLIENT_ID,
};
