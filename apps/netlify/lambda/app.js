const express = require('express');
const app = express();

app.post('/build', (req, res) => {
  // TODO: handle build app actions
  res.json({ success: true });
});

app.use((_req, res) => res.status(404).send('Not found'));

module.exports = app;
