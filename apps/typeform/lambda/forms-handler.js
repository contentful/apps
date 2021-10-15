'use strict';

const fetchForms = require('./fetch-forms');

module.exports = async (method, path, token, { fetch }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' },
    };
  }

  try {
    return {
      status: 200,
      body: { forms: await fetchForms(method, path, token, { fetch }) },
    };
  } catch (err) {
    const { message, code } = err;
    return {
      status: code,
      body: { message },
    };
  }
};
