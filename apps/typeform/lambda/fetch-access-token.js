'use strict';

const { BASE_URL } = require('./constants');
const ENDPOINT = `${BASE_URL}/oauth/token`;

module.exports = async (code, { fetch }) => {
  const body =
    `grant_type=authorization_code&code=${code}&client_id=${process.env.CLIENT_ID}&` +
    `client_secret=${process.env.CLIENT_SECRET}&redirect_uri=${process.env.OAUTH_REDIRECT_URI}`;

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (response.status !== 200) {
    console.error('Typeform token exchange failed, got response:', response.status);
    throw new Error('Typeform token exchange failed');
  }

  const result = await response.json();

  return result;
};
