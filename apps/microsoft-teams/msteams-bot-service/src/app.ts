import express from 'express';
import { Request, Response } from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default app;
