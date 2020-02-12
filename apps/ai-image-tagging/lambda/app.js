'use strict';

const path = require('path');

const express = require('express');

const tag = require('./tag');
const reportUsage = require('./usage');

const app = express();

const FRONTEND = path.dirname(require.resolve('ai-image-tagging-frontend'));

app.use('/tags', async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed.' });
    return;
  }

  const [, spaceId] = req.path.split('/')

  try {
    const count = await reportUsage(spaceId);

    console.log(`Request for ${spaceId}. Current usage: ${count}.`);

    if (count > 1000) {
      console.log(`usage:over-1k space:${spaceId}`);
    } else if (count > 10000) {
      console.log(`usage:over-10k space:${spaceId}`);
    } else if (count > 100000) {
      console.error(`Hard usage limit met for space ${spaceId}. Aborting.`);
      res.status(403).json({ message: 'Usage exceeded.' });
      return;
    }
  } catch (err) {
    console.error(`Failed to report usage for ${spaceId}.`, err);
    // Fail open.
  }

  try {
    res.json({ tags: await tag(req.path) })
  } catch (err) {
    res.status(400).json({ message: err.message || err.errorMessage });
  }
});

app.use('/frontend', express.static(FRONTEND));
app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
