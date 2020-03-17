
'use strict';

const CLIENT_ID = '8DAtABe5rFEnpJJw8Uco2e65ewrZq6kALSfCBe4N11LW';
const CLIENT_SECRET = 'Ded8DJgEQ4VE1R1bc4FriMpGhLuo3gsrVtS7raW5SdBc';
const OAUTH_URL = 'http://localhost:3000/callback';
const ENDPOINT = 'https://api.typeform.com/oauth/token';

module.exports = async (code, { fetch }) => {
  const body =
    `grant_type=authorization_code&code=${code}&client_id=${CLIENT_ID}&` +
    `client_secret=${CLIENT_SECRET}&redirect_uri=${OAUTH_URL}`;

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
