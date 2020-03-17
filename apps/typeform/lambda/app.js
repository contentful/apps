'use strict';

const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const handleForms = require('./forms-handler');
const fetchAccessToken = require('./fetch-access-token');

const deps = {
  fetch
};

const app = express();

const FRONTEND = path.dirname(require.resolve('typeform-frontend'));

app.use(cors());

app.use('/forms', async (req, res) => {
  const { status, body } = await handleForms(req.method, req.path, deps);
  res.status(status).send(body);
});

app.use('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    res.status(404).send('No Code was provided');
  }

  const { access_token, expires_in } = await fetchAccessToken(code, deps);

  res.set({
    Location: `${state}?token=${access_token}&expiresIn=${expires_in}`
  });
  res.sendStatus(302);
});

app.use('/frontend', express.static(FRONTEND));

app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
