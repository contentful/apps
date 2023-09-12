import sharp from 'sharp';
import { makeMockPlainClient } from '../test/mocks';
import { absolutePathToFile, responseFromFile } from '../test/utils';
import { SharpStreamsToUrl } from './upload-images';
import { toSharp } from './utils';
import sinon from 'sinon';
import { expect } from 'chai';

describe('SharpStreamsToUrl', () => {
  let sharpStreamsToUrl: SharpStreamsToUrl;
  const spaceId = 'spaceId';
  const uploadId = 'uploadId';
  const cmaClientStub = sinon.stub();

  describe('execute', () => {
    beforeEach(async () => {
      const imagePath = absolutePathToFile('./test/mocks/images/peaceful-cat.jpg');
      const imageResponse = await responseFromFile(imagePath);
      const sharpStreams = [toSharp(imageResponse.body)];
      const mockUploadApiResponse = {
        sys: {
          type: 'Upload',
          id: uploadId,
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: spaceId,
            },
          },
          expiresAt: '2015-05-18T11:29:46.809Z',
          createdAt: '2015-05-18T11:29:46.809Z',
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: '4FLrUHftHW3v2BLi9fzfjU',
            },
          },
        },
      };

      const cmaClient = makeMockPlainClient([mockUploadApiResponse], cmaClientStub);
      sharpStreamsToUrl = new SharpStreamsToUrl(sharpStreams, cmaClient, spaceId);
    });

    it('returns images with correct urls', async () => {
      const result = await sharpStreamsToUrl.execute();
      const image = result[0];
      expect(image).to.have.property(
        'url',
        `https://s3.us-east-1.amazonaws.com/upload-api.contentful.com/${spaceId}!upload!${uploadId}`
      );
    });
  });
});
