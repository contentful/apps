const express = require('express');
const actionHandler = require('./handlers/action');
const appEventHandler = require('./handlers/app-event');
const makeReqVerificationMiddleware = require('./helpers/verify');

const app = express();

const signingSecret = (process.env['SIGNING_SECRET'] || '').trim();

app.use(
  express.json({
    type: ['application/vnd.contentful.management.v1+json', 'application/json'],
    verify: makeReqVerificationMiddleware(signingSecret, { paths: ['/build'] }),
  })
);

app.use((err, _req, res, next) => {
  if (err) {
    res.status(500).json({ error: 'Internal error' });
  }
  next();
});

app.post('/build', actionHandler);

app.post('/app-events', appEventHandler);

module.exports = app;
