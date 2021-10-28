'use strict';

const path = require('path');

const express = require('express');
const AWS = require('aws-sdk');
const fetch = require('node-fetch');

const handle = require('./handler');

const rekog = new AWS.Rekognition();
const documentClient = new AWS.DynamoDB.DocumentClient();

const deps = {
  fetch,
  rekog,
  documentClient,
};

const app = express();

const FRONTEND = path.dirname(require.resolve('ai-image-tagging-frontend'));

app.use('/tags', async (req, res) => {
  const { status, body } = await handle(req.method, req.path, deps);
  res.status(status).json(body);
});

app.use('/frontend', express.static(FRONTEND));
app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
