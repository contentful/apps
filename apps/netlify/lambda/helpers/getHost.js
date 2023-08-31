const get = require('lodash.get');

module.exports = function getHost(req) {
  const crn = get(req.headers, 'x-contentful-crn');
  const partition = crn ? crn.split(':')[1] : '';

  switch (partition) {
    case 'contentful':
      return 'api.contentful.com';
    case 'contentful-eu':
      return 'api.eu.contentful.com';
    default:
      return 'api.contentful.com';
  }
};
