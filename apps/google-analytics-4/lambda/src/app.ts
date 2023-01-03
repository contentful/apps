import express from 'express';
const app = express();

app.get('/health', function (_req, res) {
  res.status(204).send();
});

export default app;
