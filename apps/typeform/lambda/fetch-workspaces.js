'use strict';

const fetchWorkspaces = async (method, path, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' }
    };
  }
  const [, accessToken] = path.split('/');
  const response = await fetch('https://api.typeform.com/workspaces', {
    headers: {
      Authorization: 'Bearer ' + accessToken
    }
  });

  if (response.status !== 200) {
    throw new Error(`Non-200 (${response.status}) response for GET Request`);
  }

  return await response.json();
};

module.exports = fetchWorkspaces;
