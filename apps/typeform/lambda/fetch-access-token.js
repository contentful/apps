'use strict';

const dotenv = require('dotenv');
dotenv.config();

module.exports = async (code, origin, baseUrl, { fetch }) => {
  const effectiveBaseUrl = baseUrl || 'https://api.typeform.com';
  const ENDPOINT = `${effectiveBaseUrl}/oauth/token`;

  console.log('CLIENT_ID', process.env.CLIENT_ID);
  console.log('CLIENT_SECRET', process.env.CLIENT_SECRET);
  const body =
    `grant_type=authorization_code&code=${code}&client_id=${process.env.CLIENT_ID}&` +
    `client_secret=${process.env.CLIENT_SECRET}&redirect_uri=${encodeURIComponent(
      origin
    )}/callback`;

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    console.error('Typeform token exchange failed, got response:', response.status);
    throw new Error('Typeform token exchange failed');
  }

  return response.json();
};
