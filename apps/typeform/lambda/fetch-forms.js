'use strict';

const { BASE_URL } = require('./constants');

const fetchForms = async (method, path, token, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' },
    };
  }
  const [, workspaceId] = path.split('/');
  const response = await fetch(`${BASE_URL}/forms?page_size=200&workspace_id=${workspaceId}`, {
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

module.exports = fetchForms;
