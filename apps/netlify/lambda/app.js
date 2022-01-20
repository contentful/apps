'use strict';

const express = require('express');
const fetch = require('node-fetch');
const makeReqVerificationMiddleware = require('./verify');
const app = express();

// verify signing before even bothering with other middlewares
const signingSecret = process.env['SIGNING_SECRET'] || '';
app.use(makeReqVerificationMiddleware(signingSecret));

app.use(
  express.json({
    type: ['application/vnd.contentful.management.v1+json', 'application/json'],
  })
);

app.post('/build', async (_req, res) => {
  const { buildHookId } = res.body.body;
  const buildHookUrl = `https://api.netlify.com/build_hooks/${buildHookId}`;
  fetch(buildHookUrl, { method: 'POST' });
  res.json({ success: true });
});

module.exports = app;
