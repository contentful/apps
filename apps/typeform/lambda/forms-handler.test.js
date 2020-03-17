'use strict';

const handle = require('./forms-handler');
const mocks = require('./mocks');

describe('forms handler', () => {
  test('expects HTTP GET', async () => {
    const { status, body } = await handle('PUT', '/forms', mocks);

    expect(status).toBe(405);
    expect(body).toEqual({ message: 'Method not allowed.' });
  });
});
