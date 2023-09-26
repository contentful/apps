import { makeMockPlainClient } from '../../test/mocks';
import { absolutePathToFile, responseFromFile } from '../../test/utils';
import { UploadImages } from './upload-images';
import { toSharp } from '../utils';
import sinon from 'sinon';
import { expect } from 'chai';

describe('UploadImages', () => {
  let uploadImages: UploadImages;
  const spaceId = 'spaceId';
  const uploadId = 'uploadId';
  const sourceUrl = 'http://www.example.com';
  const uploadHost = 'upload.contentful.com';
  const cmaClientStub = sinon.stub();

  describe('execute', () => {
    beforeEach(async () => {
      const imagePath = absolutePathToFile('./test/mocks/images/peaceful-cat.jpg');
      const imageResponse = await responseFromFile(imagePath);
      const imagesWithStreams = [
        { url: sourceUrl, imageType: 'png', stream: toSharp(imageResponse.body) },
      ];
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
      uploadImages = new UploadImages(imagesWithStreams, cmaClient, spaceId, uploadHost);
    });

    it('returns images with correct urls', async () => {
      const result = await uploadImages.execute();
      const image = result[0];
      const IMAGE_SIZE = 4528979;
      const relativeImageSizeDiff = Math.abs(image.size - IMAGE_SIZE) / IMAGE_SIZE; // Doing a relative diff of 10% within range because circleCI has a different size for images than local. Basically image sizes are not deterministic
      expect(image).to.have.property('url', sourceUrl);
      expect(relativeImageSizeDiff).to.below(0.1);
      expect(image.upload).to.have.property(
        'url',
        `https://s3.us-east-1.amazonaws.com/upload-api.contentful.com/${spaceId}!upload!${uploadId}`
      );
    });
  });
});
