'use strict';

const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const handleForms = require('./forms-handler');
const handleWorkspaces = require('./workspaces-handler');
const fetchAccessToken = require('./fetch-access-token');

const deps = {
  fetch,
};

const app = express();

const FRONTEND = path.dirname(require.resolve('@contentful/typeform-frontend'));

const computeLastModifiedTime = () => {
  const deployTime = process.env.DEPLOY_TIME_UNIX;
  if (typeof deployTime === 'undefined') {
    throw new Error('Missing DEPLOY_TIME_UNIX env var');
  }

  // JS uses number of _milliseconds_ since epoch, whereas unix generates number in
  // _seconds_ since epoch. So we have to convert
  const epochTime = Number(deployTime) * 1000;
  return new Date(epochTime).toUTCString();
};

app.use('/forms', async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.sendStatus(401);
  }
  const [, token] = authorization.split(' ');
  const { status, body } = await handleForms(req.method, req.path, token, deps);
  res.status(status).send(body);
});

app.use('/workspaces', async (req, res) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.sendStatus(401);
  }
  const [, token] = authorization.split(' ');
  const { status, body } = await handleWorkspaces(req.method, req.path, token, deps);
  res.status(status).send(body);
});

app.use('/callback', async (req, res) => {
  const { code } = req.query;
  const { host } = req.headers;

  if (!code) {
    res.status(400).send('No code was provided');
  }

  const protocol = process.env.LOCAL_DEV === 'true' ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const { access_token, expires_in } = await fetchAccessToken(code, origin, deps);

  res.redirect(`${origin}/frontend/?token=${access_token}&expiresIn=${expires_in}`);
});

const lastModified = computeLastModifiedTime();
app.use(
  '/frontend',
  express.static(FRONTEND, {
    lastModified,
    setHeaders: (res) => {
      res.setHeader('Last-Modified', lastModified);
    },
  })
);

app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
