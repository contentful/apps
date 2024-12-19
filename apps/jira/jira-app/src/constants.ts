let LAMBDA_URI = 'https://api.jira.ctfapps.net';
let CLIENT_ID = 'XD9k9QU9VT4Rt26u6lbO3NM0fOqvvXan';

if (import.meta.env.DEV) {
  console.log('Running in development mode');
  LAMBDA_URI = `${import.meta.env.VITE_NGROK_URL}/test`;
  CLIENT_ID = import.meta.env.VITE_ATLASSIAN_APP_CLIENT_ID || '';
}

// interface ImportMetaValue extends ImportMeta {
//   NODE_ENV?: string;
//   VITE_NGROK_URL?: string;
//   VITE_ATLASSIAN_APP_CLIENT_ID?: string;
// }

// if ((import.meta as ImportMetaValue).NODE_ENV === 'development') {
//   console.log('development');
//   LAMBDA_URI = `${(import.meta as ImportMetaValue).VITE_NGROK_URL}/test`;
//   CLIENT_ID = (import.meta as ImportMetaValue).VITE_ATLASSIAN_APP_CLIENT_ID || '';
// }

// if (process.env.NODE_ENV === 'development') {
//   console.log('development');
//   LAMBDA_URI = `${process.env.REACT_APP_NGROK_URL}/test`;
//   CLIENT_ID = process.env.REACT_APP_ATLASSIAN_APP_CLIENT_ID || '';
// }

const constants = {
  OAUTH_REDIRECT_URI: `${LAMBDA_URI}/auth`,
  CONNECT_URL: `${LAMBDA_URI}/connect.json`,
  CLIENT_ID,
};
export default constants;
