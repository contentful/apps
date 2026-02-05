'use strict';

const fetchWorkspaces = require('./fetch-workspaces');

module.exports = async (method, path, token, baseUrl, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' },
    };
  }

  try {
    return {
      status: 200,
      body: { workspaces: await fetchWorkspaces(method, path, token, baseUrl, { fetch }) },
    };
  } catch (err) {
    const { message, code, details } = err;
    return {
      status: code,
      body: { message, details },
    };
  }
};
