'use strict';

const fetchForms = require('./fetch-forms');

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
      body: { forms: await fetchForms(method, path, { fetch }) }
    };
  } catch (err) {
    return {
      status: 400,
      body: { message: err.message || err.errorMessage }
    };
  }
};
