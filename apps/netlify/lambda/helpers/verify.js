const { verifyRequest } = require('@contentful/node-apps-toolkit');

const makeCanonicalReq = (req, buf) => {
  const body = buf && buf.length ? buf.toString('utf8') : '';

  return {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body,
  };
};

module.exports = function makeReqVerificationMiddleware(secretKey, opts = { paths: [] }) {
  return (req, _res, buf) => {
    // dont even bother verifying if we dont have to
    if (!opts.paths.includes(req.path) || req.method.toLowerCase() !== 'post') {
      return;
    }

    const canonicalReq = makeCanonicalReq(req, buf);
    let isValidReq = false;
    try {
      isValidReq = verifyRequest(secretKey, canonicalReq, 0);
    } catch (err) {
      console.error(err);
      throw err;
    }

    if (!isValidReq) {
      throw new Error('Invalid request from req verification');
    }
  };
};
