'use strict';

const { BASE_URL } = require('./constants');

const fetchWorkspaces = async (method, _path, token, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' },
    };
  }
  const response = await fetch(`${BASE_URL}/workspaces`, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });

  if (!response.ok) {
    const error = new Error(`Non-200 (${response.status}) response for GET Request`);
    error.code = response.status;
    throw error;
  }

  return await response.json();
};

module.exports = fetchWorkspaces;
