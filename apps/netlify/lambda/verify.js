'use strict';

const { verifyRequest } = require('@contentful/node-apps-toolkit');

const makeCanonicalReq = (req, options = {}) => {
  if (!req.body) {
    return '';
  }

  const body = req.body && req.body.length ? req.body.toString('utf8') : '';

  return {
    path: options.path,
    headers: req.headers,
    body,
  };
};

module.exports = function makeReqVerificationMiddleware(secretKey) {
  return (req, res, next) => {
    const canonicalReq = makeCanonicalReq(req);
    const isValidReq = verifyRequest(secretKey, canonicalReq, 0);

    if (!isValidReq) {
      res.status(403).json({ error: 'Unauthorized request' });
    }

    next();
  };
};
