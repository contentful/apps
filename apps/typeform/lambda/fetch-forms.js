'use strict';

const { BASE_URL } = require('./constants');

const fetchForms = async (method, path, token, baseUrl, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' },
    };
  }
  const effectiveBaseUrl = baseUrl || BASE_URL;
  const [, workspaceId] = path.split('/');
  const response = await fetch(
    `${effectiveBaseUrl}/forms?page_size=200&workspace_id=${workspaceId}`,
    {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    }
  );

  if (!response.ok) {
    const error = new Error(`Non-200 (${response.status}) response for GET Request`);
    error.code = response.status;
    throw error;
  }

  return await response.json();
};

module.exports = fetchForms;
