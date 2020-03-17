'use strict';

const fetchWorkspaces = require('./fetch-workspaces');

module.exports = async (method, path, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' }
    };
  }

  try {
    return {
      status: 200,
      body: { workspaces: await fetchWorkspaces(method, path, { fetch }) }
    };
  } catch (err) {
    return {
      status: 400,
      body: { message: err.message || err.errorMessage }
    };
  }
};
