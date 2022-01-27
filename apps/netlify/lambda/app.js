'use strict';

const express = require('express');
const fetch = require('node-fetch');
const makeReqVerificationMiddleware = require('./verify');
const getBuildHookFromAppInstallationParams = require('./app-installation');

const app = express();

const signingSecret = process.env['SIGNING_SECRET'] || '';
const buildBaseURL = 'https://api.netlify.com/build_hooks/';

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

app.post('/build', async (req, res, next) => {
  try {
    const appActionCall = req.body;
    const buildHookId = getBuildHookFromAppInstallationParams(appActionCall);

    // fire build hook
    const buildHookUrl = `${buildBaseURL}/${buildHookId}`;
    await fetch(buildHookUrl, { method: 'POST' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = app;
