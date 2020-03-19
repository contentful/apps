'use strict';

const handle = require('../forms-handler');
const mocks = require('../mocks');

describe('forms handler', () => {
  test('expects HTTP GET', async () => {
    const { status, body } = await handle('PUT', '/forms', 'randomToken', mocks);

    expect(status).toBe(405);
    expect(body).toEqual({ message: 'Method not allowed.' });
  });

  test('returns 400 if fetching the forms fails', async () => {
    const { status } = await handle(
      'GET',
      '/forms',
      'some token',
      Object.assign({}, mocks, {
        fetch: () => {
          throw new Error('error');
        }
      })
    );

    expect(status).toBe(400);
  });
});
