import 'dotenv/config';
import express from 'express';
import { Request, Response } from 'express';
import { MsTeamsConversationService } from './services/ms-teams-conversation-service';
import { config } from './config';

const app = express();
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post('/api/messages', async (request: Request, response: Response) => {
  const msTeamsConversationService = MsTeamsConversationService.fromBotCredentials(
    config.botId,
    config.botPassword
  );
  try {
    await msTeamsConversationService.handleRequest(request, response);
  } catch (e) {
    // TODO move error handling to middleware
    console.error('request handling error', e);
    response.status(500).send({ ok: false, error: (e as Error).message });
  }
});

export default app;
