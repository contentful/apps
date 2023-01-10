import express from 'express';
const app = express();

app.get('/health', function (_req, res) {
  res.status(204).send();
});

app.get('/api/credentials', (_req, res) => {
  res.status(200).json({ status: 'active' });
});

export default app;
