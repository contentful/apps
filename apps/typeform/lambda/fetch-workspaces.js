'use strict';

const { BASE_URL } = require('./constants');

const makeError = (response) => {
  const error = new Error(`Non-200 (${response.status}) response for GET Request`);

  try {
    error.details = response.json();
  } catch (e) {
    error.details = 'Details could not be parsed';
  }
  error.code = response.status;
  return error;
};

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
    const error = makeError(response);
    throw error;
  }
  const json = await response.json();

  return await json;
};

module.exports = fetchWorkspaces;
