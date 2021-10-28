'use strict';

const handle = require('./handler');
const mocks = require('./mocks');

describe('handler', () => {
  test('expects HTTP GET', async () => {
    const { status, body } = await handle('PUT', '/something', mocks);

    expect(status).toBe(405);
    expect(body).toEqual({ message: 'Method not allowed.' });
  });

  test('reports usage and tags image', async () => {
    const { status, body } = await handle('GET', '/some-space/some-image', mocks);

    expect(status).toBe(200);
    expect(body).toEqual({ tags: ['cat', 'yolo'] });

    expect(mocks.fetch).toBeCalledWith('https://images.ctfassets.net/some-space/some-image');
    expect(mocks.documentClient.update).toBeCalledTimes(1);
    expect(mocks.rekog.detectLabels).toBeCalledTimes(1);
  });
});
