'use strict';

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

const fetchWorkspaces = async (method, _path, token, baseUrl, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' },
    };
  }
  const effectiveBaseUrl = baseUrl || 'https://api.typeform.com';
  const response = await fetch(`${effectiveBaseUrl}/workspaces`, {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  });

  console.log('response', response);
  if (!response.ok) {
    const error = makeError(response);
    throw error;
  }
  const json = await response.json();
  console.log('json', json);
  return await json;
};

module.exports = fetchWorkspaces;
