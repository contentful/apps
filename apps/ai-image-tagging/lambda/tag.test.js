'use strict';

const tag = require('./tag');

const { fetch, rekog } = require('./mocks');

describe('tagging', () => {
  test('fetches image and passes it to rekognition', async () => {
    const tags = await tag('/some-images-api-path', { fetch, rekog });

    expect(tags).toEqual(['cat', 'yolo']);

    expect(fetch).toBeCalledWith('https://images.ctfassets.net/some-images-api-path');

    expect(rekog.detectLabels).toBeCalledWith({
      Image: {
        Bytes: 'SOME_ARR_BUFF'
      },
      MaxLabels: 10,
      MinConfidence: 70.0
    });
  });

  test('throws when image cannot be fetched', async () => {
    expect.assertions(1);

    fetch.mockResolvedValueOnce({ status: 404 });

    try {
      await tag('/i-do-not-exist', { fetch, rekog });
    } catch (err) {
      expect(err.message).toBe(
        'Non-200 (404) response for GET https://images.ctfassets.net/i-do-not-exist.'
      );
    }
  });
});
