'use strict';

const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const handle = require('./handler');

const deps = {
  fetch
};

const app = express();

const FRONTEND = path.dirname(require.resolve('typeform-frontend'));
console.log(FRONTEND);

app.use(cors());

app.use('/forms', async (req, res) => {
  const { status, body } = await handle(req.method, req.path, deps);
  res.status(status).send(body);
});

app.use('/frontend', express.static(FRONTEND));

app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
