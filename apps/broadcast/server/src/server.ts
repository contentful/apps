import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { streamText, tool, type CoreMessage, type TextStreamPart } from 'ai';
import { z } from 'zod';

// Tool definitions for client-side execution
// These tools are defined on the server but executed by the client using sdk.cma
const tools = {
  find_entry: tool({
    description: 'Search for entries by text/title to get their ID.',
    inputSchema: z.object({
      query: z.string().describe('The search query to find entries'),
    }),
    // No execute - client handles this
  }),
  generate_video: tool({
    description: 'Generate a video for a specific entry ID.',
    inputSchema: z.object({
      entryId: z.string().describe('The Contentful entry ID'),
    }),
    // No execute - client handles this
  }),
};

// Data stream format codes (used by useChat with streamProtocol: 'data')
// See: @ai-sdk/ui-utils/src/data-stream-parts.ts
const DATA_STREAM_CODES = {
  text: '0',
  data: '2',
  error: '3',
  messageAnnotations: '8',
  toolCall: '9',
  toolResult: 'a',
  toolCallStreamingStart: 'b',
  toolCallDelta: 'c',
  finishMessage: 'd',
  finishStep: 'e',
  startStep: 'f',
  reasoning: 'g',
  source: 'h',
  redactedReasoning: 'i',
  reasoningSignature: 'j',
  file: 'k',
} as const;

// Format a part as data stream format: CODE:JSON\n
const formatDataStreamPart = (code: string, value: unknown): string => {
  return `${code}:${JSON.stringify(value)}\n`;
};

// Convert fullStream parts to data stream format
const streamToDataStream = async (
  fullStream: AsyncIterable<TextStreamPart<typeof tools>>,
  res: ServerResponse
) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Vercel-AI-Data-Stream': 'v1',
  });

  for await (const part of fullStream) {
    let chunk: string | null = null;

    switch (part.type) {
      case 'text-delta':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.text, part.text);
        break;
      case 'reasoning-delta':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.reasoning, part.text);
        break;
      case 'tool-call':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.toolCall, {
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.input,
        });
        break;
      case 'tool-result':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.toolResult, {
          toolCallId: part.toolCallId,
          result: part.output,
        });
        break;
      case 'tool-input-start':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.toolCallStreamingStart, {
          toolCallId: part.id,
          toolName: part.toolName,
        });
        break;
      case 'tool-input-delta':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.toolCallDelta, {
          toolCallId: part.id,
          argsTextDelta: part.delta,
        });
        break;
      case 'start-step':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.startStep, {
          messageId: randomUUID(),
        });
        break;
      case 'finish-step':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.finishStep, {
          finishReason: part.finishReason,
          usage: part.usage,
          isContinued: false,
        });
        break;
      case 'finish':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.finishMessage, {
          finishReason: part.finishReason,
          usage: part.totalUsage,
        });
        break;
      case 'error':
        chunk = formatDataStreamPart(DATA_STREAM_CODES.error, part.error);
        break;
      // Skip other parts for now (sources, files, etc.)
    }

    if (chunk) {
      res.write(chunk);
    }
  }

  res.end();
};

const PORT = Number(process.env.PORT ?? 8787);
const REGION = 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-haiku-4-5-20251001-v1:0';
const DEBUG = process.env.AGENT_DEBUG === 'true';
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

type UiUtilsToolInvocation = {
  state: 'partial-call' | 'call' | 'result';
  toolCallId: string;
  toolName: string;
  args?: unknown;
  input?: unknown;
  result?: unknown;
  output?: unknown;
};

type UiUtilsMessage = {
  role?: string;
  content?: unknown;
  parts?: unknown;
  toolInvocations?: unknown;
  reasoning?: unknown;
};

const isValidCoreMessages = (messages: unknown): messages is CoreMessage[] => {
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

const looksLikeUiMessages = (messages: unknown) => {
  if (!Array.isArray(messages)) return false;
  return messages.some((message) => {
    if (!message || typeof message !== 'object') return false;
    const hasParts = 'parts' in message && Array.isArray((message as { parts?: unknown }).parts);
    const hasToolInvocations =
      'toolInvocations' in message &&
      Array.isArray((message as { toolInvocations?: unknown }).toolInvocations);
    return hasParts || hasToolInvocations;
  });
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

const removeEmptyCoreMessages = (messages: CoreMessage[]) =>
  messages.filter((message) => {
    if (message.role === 'assistant' || message.role === 'tool') {
      return Array.isArray(message.content) && message.content.length > 0;
    }
    if (message.role === 'system' || message.role === 'user') {
      return getUserText(message.content).trim().length > 0;
    }
    return true;
  });

const getTextFromUiMessage = (message: UiUtilsMessage) => {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (!Array.isArray(message.parts)) {
    return '';
  }

  return message.parts
    .map((part) => {
      if (
        part &&
        typeof part === 'object' &&
        'type' in part &&
        (part as { type?: string }).type === 'text' &&
        'text' in part &&
        typeof (part as { text?: unknown }).text === 'string'
      ) {
        return (part as { text: string }).text;
      }
      return '';
    })
    .join(' ');
};

const getToolInvocationsFromUiMessage = (message: UiUtilsMessage): UiUtilsToolInvocation[] => {
  const invocations: UiUtilsToolInvocation[] = [];
  const seen = new Set<string>();

  const addInvocation = (invocation: UiUtilsToolInvocation) => {
    const key = `${invocation.toolCallId}:${invocation.toolName}:${invocation.state}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    invocations.push(invocation);
  };

  if (Array.isArray(message.toolInvocations)) {
    for (const invocation of message.toolInvocations) {
      if (
        invocation &&
        typeof invocation === 'object' &&
        'state' in invocation &&
        'toolCallId' in invocation &&
        'toolName' in invocation
      ) {
        addInvocation(invocation as UiUtilsToolInvocation);
      }
    }
  }

  if (Array.isArray(message.parts)) {
    for (const part of message.parts) {
      if (
        part &&
        typeof part === 'object' &&
        'type' in part &&
        (part as { type?: string }).type === 'tool-invocation' &&
        'toolInvocation' in part &&
        typeof (part as { toolInvocation?: unknown }).toolInvocation === 'object'
      ) {
        addInvocation((part as { toolInvocation: UiUtilsToolInvocation }).toolInvocation);
      }
    }
  }

  return invocations;
};

const normalizeToolOutput = (output: unknown) => {
  if (output && typeof output === 'object' && 'type' in output && 'value' in output) {
    const type = (output as { type?: unknown }).type;
    if (
      type === 'text' ||
      type === 'json' ||
      type === 'error-text' ||
      type === 'error-json' ||
      type === 'content'
    ) {
      return output;
    }
  }

  if (typeof output === 'string') {
    return { type: 'text', value: output };
  }

  return { type: 'json', value: output ?? null };
};

const toCoreMessagesFromUiUtils = (messages: unknown): CoreMessage[] | null => {
  if (!Array.isArray(messages)) return null;

  const coreMessages: CoreMessage[] = [];

  for (const message of messages) {
    if (!message || typeof message !== 'object' || !('role' in message)) {
      return null;
    }

    const uiMessage = message as UiUtilsMessage;
    const role = uiMessage.role;

    if (role === 'data') {
      continue;
    }

    if (role === 'system' || role === 'user') {
      const text = getTextFromUiMessage(uiMessage).trim();
      if (text.length > 0) {
        coreMessages.push({ role, content: text });
      }
      continue;
    }

    if (role === 'assistant') {
      const text = getTextFromUiMessage(uiMessage).trim();
      const toolInvocations = getToolInvocationsFromUiMessage(uiMessage);
      const seenToolResults = new Set<string>();
      const assistantParts: CoreMessage['content'] = [];

      if (text) {
        assistantParts.push({ type: 'text', text });
      }

      const seenToolCalls = new Set<string>();
      for (const invocation of toolInvocations) {
        if (
          invocation.state === 'partial-call' ||
          invocation.state === 'call' ||
          invocation.state === 'result'
        ) {
          const callKey = `${invocation.toolCallId}:${invocation.toolName}`;
          if (seenToolCalls.has(callKey)) {
            continue;
          }
          seenToolCalls.add(callKey);
          assistantParts.push({
            type: 'tool-call',
            toolCallId: invocation.toolCallId,
            toolName: invocation.toolName,
            input: invocation.args ?? invocation.input ?? {},
          });
        }
      }

      if (assistantParts.length > 0) {
        coreMessages.push({ role: 'assistant', content: assistantParts });
      }

      for (const invocation of toolInvocations) {
        if (invocation.state === 'result') {
          const resultKey = `${invocation.toolCallId}:${invocation.toolName}`;
          if (seenToolResults.has(resultKey)) {
            continue;
          }
          seenToolResults.add(resultKey);
          coreMessages.push({
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: invocation.toolCallId,
                toolName: invocation.toolName,
                output: normalizeToolOutput(invocation.result ?? invocation.output ?? null),
              },
            ],
          });
        }
      }

      continue;
    }

    return null;
  }

  return coreMessages;
};

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
  const rawCoreMessages = looksLikeUiMessages(messages)
    ? toCoreMessagesFromUiUtils(messages)
    : (isValidCoreMessages(messages) && messages) || toCoreMessagesFromUiUtils(messages);

  if (!rawCoreMessages) {
    sendJson(res, 400, { error: 'Messages must include at least one valid UI or core message.' });
    return;
  }

  const coreMessages = removeEmptyCoreMessages(rawCoreMessages);

  if (!hasUserMessage(coreMessages)) {
    sendJson(res, 400, { error: 'Messages must include at least one user message.' });
    return;
  }

  if (DEBUG) {
    const rawMessagesSummary = Array.isArray(messages)
      ? messages.map((message) => {
          if (!message || typeof message !== 'object') {
            return { role: 'unknown' };
          }
          const role = (message as { role?: unknown }).role;
          const parts = (message as { parts?: unknown }).parts;
          const toolInvocations = (message as { toolInvocations?: unknown }).toolInvocations;
          const partTypes = Array.isArray(parts)
            ? parts
                .map((part) =>
                  part && typeof part === 'object' && 'type' in part
                    ? (part as { type?: string }).type
                    : 'unknown'
                )
                .filter(Boolean)
            : [];
          const toolStates = Array.isArray(toolInvocations)
            ? toolInvocations
                .map((invocation) =>
                  invocation && typeof invocation === 'object' && 'state' in invocation
                    ? (invocation as { state?: string }).state
                    : 'unknown'
                )
                .filter(Boolean)
            : [];
          return { role, partTypes, toolStates };
        })
      : [];
    console.log('[Agent Server] Raw messages summary:', JSON.stringify(rawMessagesSummary));
    const compactMessages = coreMessages.map((message) => {
      if (message.role === 'assistant' || message.role === 'tool') {
        return {
          role: message.role,
          content: Array.isArray(message.content)
            ? message.content.map((part) => {
                if (part.type === 'tool-call') {
                  return {
                    type: part.type,
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    input: part.input,
                  };
                }
                if (part.type === 'tool-result') {
                  return {
                    type: part.type,
                    toolCallId: part.toolCallId,
                    toolName: part.toolName,
                    output: part.output,
                  };
                }
                if (part.type === 'text') {
                  return { type: part.type, text: part.text };
                }
                return { type: part.type };
              })
            : message.content,
        };
      }
      return {
        role: message.role,
        content: message.content,
      };
    });
    console.log('[Agent Server] Core messages payload:', JSON.stringify(compactMessages));
  }

  try {
    const bedrock = createAmazonBedrock({ apiKey, region: REGION });
    const result = streamText({
      model: bedrock(MODEL_ID),
      messages: coreMessages,
      tools,
      maxSteps: 5,
    });

    await streamToDataStream(result.fullStream, res);
  } catch (error) {
    console.error('[Agent Server] Bedrock request failed.', error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Failed to generate response.' });
    }
  }
});

server.listen(PORT, () => {
  console.log(`[Agent Server] Listening on http://localhost:${PORT}`);
});
