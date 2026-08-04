import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler, OpenAiProxyParameters } from './openai-proxy';

type HandlerEvent = Parameters<typeof handler>[0];
type HandlerContext = Parameters<typeof handler>[1];

// The proxy only reads `key` off the installation params and `messages`/`model`
// off the action body — build the smallest shapes the handler actually touches.
const makeEvent = (body: OpenAiProxyParameters): HandlerEvent =>
  ({ body } as unknown as HandlerEvent);

const makeContext = (key?: string): HandlerContext =>
  ({ appInstallationParameters: key ? { key } : {} } as unknown as HandlerContext);

const validBody: OpenAiProxyParameters = {
  messages: JSON.stringify([{ role: 'user', content: 'hi' }]),
  model: 'gpt-4',
};

describe('openai-proxy handler', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('throws when no API key is configured', async () => {
    await expect(handler(makeEvent(validBody), makeContext())).rejects.toThrow(
      'OpenAI API key is not configured'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws when messages is not valid JSON', async () => {
    const event = makeEvent({ messages: 'not json', model: 'gpt-4' });

    await expect(handler(event, makeContext('sk-test'))).rejects.toThrow(
      'Invalid messages parameter: must be a JSON-encoded array'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls OpenAI with the key and parsed messages, returning the completion text', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'generated' } }] }),
    } as Response);

    const result = await handler(makeEvent(validBody), makeContext('sk-test'));

    expect(result).toEqual({ text: 'generated' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer sk-test' }),
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'hi' }],
        }),
      })
    );
  });

  it('returns empty text when the completion has no content', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    } as Response);

    const result = await handler(makeEvent(validBody), makeContext('sk-test'));

    expect(result).toEqual({ text: '' });
  });

  it('surfaces the OpenAI error message on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { message: 'Invalid API key' } }),
    } as Response);

    await expect(handler(makeEvent(validBody), makeContext('sk-test'))).rejects.toThrow(
      'OpenAI request failed: 401 Invalid API key'
    );
  });

  it('falls back to statusText when the error body has no message', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    await expect(handler(makeEvent(validBody), makeContext('sk-test'))).rejects.toThrow(
      'OpenAI request failed: 500 Internal Server Error'
    );
  });
});
