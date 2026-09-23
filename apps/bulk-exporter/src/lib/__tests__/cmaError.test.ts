import { describe, it, expect } from 'vitest';
import { isResponseTooBigError, extractErrorMessage } from '../cmaError';

const API_MESSAGE = 'Response size too big. Maximum allowed response size: 7340032B.';

/** The raw API error body, as returned by the CMA. */
const rawApiError = {
  sys: { type: 'Error', id: 'BadRequest' },
  message: API_MESSAGE,
  requestId: '9a90d083-9da4-46c0-adcf-cad04aea653a',
};

/** What contentful-sdk-core throws: the code in `name`, a JSON blob in `message`. */
const sdkCoreError = Object.assign(
  new Error(
    JSON.stringify(
      {
        status: 400,
        statusText: 'Bad Request',
        message: API_MESSAGE,
        request: { url: '/entries', headers: { Authorization: 'Bearer ...ecret' } },
        requestId: '9a90d083-9da4-46c0-adcf-cad04aea653a',
      },
      null,
      '  '
    )
  ),
  { name: 'BadRequest' }
);

/**
 * What an app actually catches: the web app relays the rejection into the
 * iframe over postMessage, which strips the prototype and every
 * non-enumerable field, leaving `{ code, message, data }`.
 */
const bridgedError = {
  code: 'BadRequest',
  message: sdkCoreError.message,
  data: undefined,
};

describe('isResponseTooBigError', () => {
  it('detects the response-size error in every shape it can arrive as', () => {
    expect(isResponseTooBigError(rawApiError)).toBe(true);
    expect(isResponseTooBigError(sdkCoreError)).toBe(true);
    expect(isResponseTooBigError(bridgedError)).toBe(true);
  });

  it('ignores unrelated failures', () => {
    expect(isResponseTooBigError({ sys: { id: 'AccessDenied' }, message: 'Nope' })).toBe(false);
    expect(isResponseTooBigError(new Error('Rate limit exceeded'))).toBe(false);
    expect(isResponseTooBigError({ code: 'BadRequest', message: 'Unknown field' })).toBe(false);
    expect(isResponseTooBigError('not an object')).toBe(false);
    expect(isResponseTooBigError(null)).toBe(false);
    expect(isResponseTooBigError(undefined)).toBe(false);
  });
});

describe('extractErrorMessage', () => {
  it("returns the API's own message rather than the JSON blob wrapping it", () => {
    expect(extractErrorMessage(rawApiError)).toBe(API_MESSAGE);
    expect(extractErrorMessage(sdkCoreError)).toBe(API_MESSAGE);
    expect(extractErrorMessage(bridgedError)).toBe(API_MESSAGE);
  });

  it('keeps the obscured auth header out of the message', () => {
    expect(extractErrorMessage(bridgedError)).not.toContain('Authorization');
  });

  it('passes through a plain message unchanged', () => {
    expect(extractErrorMessage(new Error('Boom'))).toBe('Boom');
  });

  it('falls back to "Unknown error" when there is no usable message', () => {
    expect(extractErrorMessage('not an object')).toBe('Unknown error');
    expect(extractErrorMessage(null)).toBe('Unknown error');
    expect(extractErrorMessage({})).toBe('Unknown error');
    expect(extractErrorMessage({ message: '{ truncated json' })).toBe('{ truncated json');
  });
});
