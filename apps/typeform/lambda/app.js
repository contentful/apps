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
const CLIENT_SECRET = 'ByNjuGDXBrjLf38sJQ8B8cDrRMW4jGVYk15PfyemHt7H';

const app = express();

const FRONTEND = path.dirname(require.resolve('typeform-frontend'));

app.use(cors());

app.use('/forms', async (req, res) => {
  const { status, body } = await handle(req.method, req.path, deps);
  res.status(status).send(body);
});

app.use('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    res.status(404).send('No Code was provided');
  }

  console.log(code);

  const response = await fetch(
    `https://api.typeform.com/oauth/token?grant_type=authorization_code&code=${code}&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&redirect_uri=http://localhost:1234/frontend`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  const result = await response.json();
  console.log(result);
});

app.use('/frontend', express.static(FRONTEND));

app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
