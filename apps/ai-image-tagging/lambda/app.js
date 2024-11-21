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

const FRONTEND = path.dirname(require.resolve('@contentful/ai-image-tagging-frontend'));

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

app.use('/tags', async (req, res) => {
  const { status, body } = await handle(req.method, req.path, deps);
  res.status(status).json(body);
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
