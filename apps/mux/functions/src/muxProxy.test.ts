import { beforeEach, describe, expect, it, vi } from 'vitest';

const muxFetch = vi.fn();
vi.mock('./helpers/muxClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./helpers/muxClient')>()),
  muxFetch: (...args: unknown[]) => muxFetch(...args),
}));

import { handler } from './muxProxy';

const context = {
  appInstallationParameters: { muxAccessTokenId: 'id', muxAccessTokenSecret: 'secret' },
} as any;

const event = (path = '/robots/v0/jobs/summarize', method = 'POST') =>
  ({ body: { method, path, body: JSON.stringify({ parameters: {} }) } } as any);

const muxResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response);

describe('muxProxy', () => {
  beforeEach(() => {
    muxFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('forwards Mux error.type so the caller can tell 403s apart', async () => {
    muxFetch.mockResolvedValue(
      muxResponse(403, {
        error: { type: 'robots_units_limit_exceeded', messages: ['Monthly unit limit reached'] },
      })
    );

    const result = await handler(event(), context);

    expect(result).toEqual({
      ok: false,
      error: 'Monthly unit limit reached',
      errorType: 'robots_units_limit_exceeded',
      status: 403,
    });
  });

  it('distinguishes a missing-scope 403 from a units-exhausted 403', async () => {
    muxFetch.mockResolvedValue(
      muxResponse(403, {
        error: { type: 'insufficient_scope', messages: ['Token is missing the robots:* scope'] },
      })
    );

    const result = (await handler(event(), context)) as any;

    expect(result.status).toBe(403);
    expect(result.errorType).toBe('insufficient_scope');
  });

  it('leaves errorType undefined when Mux sends no type', async () => {
    muxFetch.mockResolvedValue(muxResponse(400, { error: { messages: ['Bad request'] } }));

    const result = (await handler(event(), context)) as any;

    expect(result.error).toBe('Bad request');
    expect(result.errorType).toBeUndefined();
  });

  it('names Mux and the status when the error body is unparseable', async () => {
    // The old fallback here was the literal string 'Unknown error', which is what an editor saw
    // for any body that did not match the Video API's envelope. It told them nothing — not even
    // that Mux was the one refusing.
    muxFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response);

    expect(await handler(event(), context)).toEqual({
      ok: false,
      error: 'Mux rejected this request (HTTP 500)',
      errorType: undefined,
      status: 500,
    });
  });

  it('keeps every message on a validation error, not just the first', async () => {
    // A rejected job lists one message per bad parameter. Forwarding `messages[0]` turned
    // "three of your parameters are invalid" into one of the three, and the editor fixed one
    // field at a time, paying a round trip for each.
    muxFetch.mockResolvedValue(
      muxResponse(400, {
        error: {
          type: 'invalid_parameters',
          messages: [
            'parameters.max_moments must be an integer',
            'parameters.target_duration_ms is not a valid parameter',
          ],
        },
      })
    );

    const result = (await handler(event(), context)) as any;

    expect(result.error).toBe(
      'parameters.max_moments must be an integer parameters.target_duration_ms is not a valid parameter'
    );
    expect(result.errorType).toBe('invalid_parameters');
  });

  it('reads the error shapes Mux uses outside the documented envelope', async () => {
    // Robots is newer than the rest of the API, and a 400 from it does not reliably arrive as
    // `{ error: { messages: [] } }`. Each of these used to produce 'Unknown error'.
    const shapes: Array<[unknown, string]> = [
      [{ error: { message: 'Singular message' } }, 'Singular message'],
      [{ message: 'Top level message' }, 'Top level message'],
      [{ messages: ['Top level array'] }, 'Top level array'],
      [{ errors: [{ message: 'Object in an array' }] }, 'Object in an array'],
      [{ errors: ['String in an array'] }, 'String in an array'],
      [{ error: 'error as a string' }, 'error as a string'],
    ];

    for (const [body, expected] of shapes) {
      muxFetch.mockResolvedValue(muxResponse(400, body));
      const result = (await handler(event(), context)) as any;
      expect(result.error, JSON.stringify(body)).toBe(expected);
    }
  });

  it('falls back rather than reporting an empty message', async () => {
    // An empty array or a blank string must not win over the status fallback — that would put an
    // empty error toast on screen.
    muxFetch.mockResolvedValue(muxResponse(422, { error: { messages: [], message: '  ' } }));

    const result = (await handler(event(), context)) as any;

    expect(result.error).toBe('Mux rejected this request (HTTP 422)');
  });

  it('passes successful Robots responses through untouched', async () => {
    const job = { data: { id: 'rjob_1', status: 'pending', workflow: 'summarize' } };
    muxFetch.mockResolvedValue(muxResponse(201, job));

    expect(await handler(event(), context)).toEqual({ ok: true, data: job });
  });

  it('reports missing credentials without calling Mux', async () => {
    const result = await handler(event(), { appInstallationParameters: {} } as any);

    expect(result).toEqual({ ok: false, error: 'Missing Mux API credentials', status: 401 });
    expect(muxFetch).not.toHaveBeenCalled();
  });

  it('reports a network failure as a 502 the caller can treat as unknown', async () => {
    muxFetch.mockRejectedValue(new Error('socket hang up'));

    expect(await handler(event(), context)).toEqual({
      ok: false,
      error: 'Network error calling Mux API',
      status: 502,
    });
  });

  it('returns an empty payload for a 204', async () => {
    muxFetch.mockResolvedValue({ ok: true, status: 204, json: () => Promise.resolve({}) } as any);

    expect(await handler(event('/robots/v0/directives/drv_1', 'DELETE'), context)).toEqual({
      ok: true,
      data: {},
    });
  });
});
