import express from 'express';
import type { Request, Response } from 'express';
import { score } from './handler';
import type { ScoreRequest } from './types';

const app = express();
app.use(express.json({ limit: '5mb' }));

// CORS — the app frontend is hosted by Contentful's CDN from a different origin
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  next();
});

app.options('/score', (_req, res) => {
  res.sendStatus(204);
});

app.post('/score', async (req: Request, res: Response) => {
  const body = req.body as Partial<ScoreRequest>;

  if (!body.runId || typeof body.input !== 'string' || typeof body.output !== 'string') {
    res.status(400).json({ error: 'Request body must include "runId", "input", and "output".' });
    return;
  }

  try {
    const result = await score(body as ScoreRequest);
    res.json(result);
  } catch (err) {
    console.error('Scoring error:', err);
    res.status(500).json({ error: 'Internal scoring error.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Debug: echo back the first few messages so we can inspect the real shape
app.post('/debug', (req: Request, res: Response) => {
  const { messages } = req.body as { messages?: unknown[] };
  res.json({ count: messages?.length ?? 0, sample: messages?.slice(0, 3) ?? [] });
});

export { app };
