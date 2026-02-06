'use strict';

const handle = require('../forms-handler');
const mocks = require('../mocks');

describe('forms handler', () => {
  test('expects HTTP GET', async () => {
    const { status, body } = await handle('PUT', '/forms', 'randomToken', mocks);

    expect(status).toBe(405);
    expect(body).toEqual({ message: 'Method not allowed.' });
  });

  test('returns the appropriate error code if fetching the forms fails', async () => {
    const errorCode = 401;
    const { status } = await handle(
      'GET',
      '/forms',
      'some token',
      Object.assign({}, mocks, {
        fetch: () => {
          const error = new Error('Some error happened');
          error.code = errorCode;
          throw error;
        },
      })
    );

    expect(status).toBe(errorCode);
  });
});
