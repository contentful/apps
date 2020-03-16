'use strict';

const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const handle = require('./handler');

const deps = {
  fetch
};

const CLIENT_ID = '8DAtABe5rFEnpJJw8Uco2e65ewrZq6kALSfCBe4N11LW';
const CLIENT_SECRET = 'Ded8DJgEQ4VE1R1bc4FriMpGhLuo3gsrVtS7raW5SdBc';
const OAUTH_URL = 'http://localhost:3000/callback';

const app = express();

const FRONTEND = path.dirname(require.resolve('typeform-frontend'));

app.use(cors());

app.use('/forms', async (req, res) => {
  const { status, body } = await handle(req.method, req.path, deps);
  res.status(status).send(body);
});

app.use('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    res.status(404).send('No Code was provided');
  }

  const endpoint = `https://api.typeform.com/oauth/token?grant_type=authorization_code?code=${code}?client_id=${CLIENT_ID}?client_secret=${CLIENT_SECRET}?redirect_uri=${OAUTH_URL}`;
  const response = await fetch(endpoint, {
    method: 'POST'
  });

  console.log(state);
  console.log(response.json());
  if (response.status !== 200) {
    console.error('Typeform token exchange failed, got response:', response.status);
    throw new Error('Typeform token exchange failed');
  }

  res.sendStatus(200);
});

app.use('/frontend', express.static(FRONTEND));

app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
