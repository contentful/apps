import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { streamText, type CoreMessage } from 'ai';

const PORT = Number(process.env.PORT ?? 8787);
const REGION = 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-haiku-4-5-20251001-v1:0';
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const NGROK_ORIGIN = /^https?:\/\/[a-z0-9-]+\.ngrok(-free)?\.app$/i;

const getAllowedOrigins = () => {
  const raw = process.env.AGENT_ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const isAllowedOrigin = (origin: string) => {
  if (LOCALHOST_ORIGIN.test(origin) || NGROK_ORIGIN.test(origin)) return true;
  const allowlist = getAllowedOrigins();
  return allowlist.includes(origin);
};

const sendJson = (res: ServerResponse, status: number, body: Record<string, unknown>) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const setCorsHeaders = (req: IncomingMessage, res: ServerResponse) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const readBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

const isValidMessages = (messages: unknown): messages is CoreMessage[] => {
  if (!Array.isArray(messages)) return false;
  return messages.every(
    (message) =>
      message &&
      typeof message === 'object' &&
      'role' in message &&
      'content' in message &&
      (message as { role?: string }).role !== undefined &&
      (typeof (message as { content?: unknown }).content === 'string' ||
        Array.isArray((message as { content?: unknown }).content))
  );
};

const getUserText = (content: CoreMessage['content']) => {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  const parts = content.filter(
    (part): part is { type: 'text'; text: string } =>
      typeof part === 'object' &&
      part !== null &&
      'type' in part &&
      (part as { type?: string }).type === 'text' &&
      'text' in part &&
      typeof (part as { text?: unknown }).text === 'string'
  );

  return parts.map((part) => part.text).join(' ');
};

const hasUserMessage = (messages: CoreMessage[]) =>
  messages.some(
    (message) => message.role === 'user' && getUserText(message.content).trim().length > 0
  );

const server = http.createServer(async (req, res) => {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/agent/stream') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  const apiKey = process.env.AWS_BEARER_TOKEN_BEDROCK;
  if (!apiKey) {
    console.error('[Agent Server] Missing AWS_BEARER_TOKEN_BEDROCK.');
    sendJson(res, 500, { error: 'Bedrock credentials are not configured.' });
    return;
  }

  let payload: { messages?: unknown };
  try {
    const raw = await readBody(req);
    payload = JSON.parse(raw);
  } catch (error) {
    console.error('[Agent Server] Failed to parse request body.', error);
    sendJson(res, 400, { error: 'Invalid JSON body.' });
    return;
  }

  const { messages } = payload;
  if (!isValidMessages(messages) || !hasUserMessage(messages)) {
    sendJson(res, 400, { error: 'Messages must include at least one user message.' });
    return;
  }

  try {
    const bedrock = createAmazonBedrock({ apiKey, region: REGION });
    const result = await streamText({
      model: bedrock(MODEL_ID),
      messages,
    });

    result.pipeTextStreamToResponse(res);
  } catch (error) {
    console.error('[Agent Server] Bedrock request failed.', error);
    sendJson(res, 500, { error: 'Failed to generate response.' });
  }
});

server.listen(PORT, () => {
  console.log(`[Agent Server] Listening on http://localhost:${PORT}`);
});
