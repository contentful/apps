'use strict';

const fetchAccessToken = require('../fetch-access-token');
const mocks = require('../mocks');

describe('auth handler', () => {
  test('throws when token exchange fails', async () => {
    const fn = () =>
      fetchAccessToken(
        'code',
        'http://some-origin',
        Object.assign(mocks, {
          fetch: jest.fn().mockResolvedValue({
            status: 500,
          }),
        })
      );
    expect(fn()).rejects.toEqual(new Error('Typeform token exchange failed'));
  });
});
