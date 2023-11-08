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
  await msTeamsConversationService.handleRequest(request, response);
});

export default app;
