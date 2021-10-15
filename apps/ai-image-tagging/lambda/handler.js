'use strict';

const tag = require('./tag');
const reportUsage = require('./usage');

module.exports = async (method, path, { fetch, rekog, documentClient }) => {
  if (method !== 'GET') {
    return {
      status: 405,
      body: { message: 'Method not allowed.' },
    };
  }

  const [, spaceId] = path.split('/');

  try {
    const [count, period] = await reportUsage(spaceId, documentClient);

    console.log(`Request for ${spaceId}. Current usage: ${count} in ${period}.`);

    if (count > 1000) {
      console.log(`usage:over-1k spaceId:${spaceId} period:${period}`);
    } else if (count > 10000) {
      console.log(`usage:over-10k spaceId:${spaceId} period:${period}`);
    } else if (count > 100000) {
      console.error(`Hard usage limit exceeded for space ${spaceId}. Aborting.`);
      return {
        status: 403,
        message: 'Usage exceeded.',
      };
    }
  } catch (err) {
    console.error(`Failed to report usage for ${spaceId}.`, err);
    // Fail open.
  }

  try {
    return {
      status: 200,
      body: { tags: await tag(path, { fetch, rekog }) },
    };
  } catch (err) {
    return {
      status: 400,
      body: { message: err.message || err.errorMessage },
    };
  }
};
