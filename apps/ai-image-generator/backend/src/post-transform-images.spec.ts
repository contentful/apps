import * as nodeFetch from 'node-fetch';

import { expect } from 'chai';
import { mockLandscapeAiImages, mockPortraitAiImages } from '../test/mocks';
import { readableStreamFromFile, writeFiles } from '../test/utils';
import { PostTransformImages } from './post-transform-images';
import { toDimensions } from './utils';
import sharp from 'sharp';
import sinon from 'sinon';

describe('PostTransformImages', () => {
  let fetchStub: sinon.SinonStub;

  beforeEach(async () => {
    fetchStub = sinon.stub(nodeFetch, 'default');
    fetchStub.callsFake(async (url: string): Promise<nodeFetch.Response> => {
      const fileContents = await readableStreamFromFile(url);
      return new Promise((resolve) =>
        resolve(new nodeFetch.Response(fileContents, { status: 200 }))
      );
    });
  });

  afterEach(async () => {
    fetchStub.restore();
  });

  describe('#execute', () => {
    let postTransformImages: PostTransformImages;

    describe('when image result is landscape', () => {
      beforeEach(async () => {
        const images = mockLandscapeAiImages;
        const dimensions = toDimensions(1487, 1066);
        postTransformImages = new PostTransformImages(images, dimensions);
      });

      it('returns transformed streams', async () => {
        const result = await postTransformImages.execute();
        const imageSharp = sharp(await result[0].stream.toBuffer());

        await writeFiles({ imageSharp }, 'result-landscape');

        const imageMetadata = await imageSharp.metadata();

        expect(imageMetadata).to.have.property('width', 1024);
        expect(imageMetadata).to.have.property('height', 734);
        expect(imageMetadata).to.have.property('format', 'png');
      });
    });

    describe('when image is small landscape', () => {
      beforeEach(async () => {
        const images = mockLandscapeAiImages;
        const dimensions = toDimensions(900, 645);
        postTransformImages = new PostTransformImages(images, dimensions);
      });

      it('returns transformed streams', async () => {
        const result = await postTransformImages.execute();
        const imageSharp = sharp(await result[0].stream.toBuffer());

        await writeFiles({ imageSharp }, 'result-landscape-small');

        const imageMetadata = await imageSharp.metadata();

        expect(imageMetadata).to.have.property('width', 900);
        expect(imageMetadata).to.have.property('height', 645);
        expect(imageMetadata).to.have.property('format', 'png');
      });
    });

    describe('when image result is portrait', () => {
      beforeEach(async () => {
        const images = mockPortraitAiImages;
        const dimensions = toDimensions(1500, 2000);
        postTransformImages = new PostTransformImages(images, dimensions);
      });

      it('returns transformed streams', async () => {
        const result = await postTransformImages.execute();
        const imageSharp = sharp(await result[0].stream.toBuffer());

        await writeFiles({ imageSharp }, 'result-portrait');

        const imageMetadata = await imageSharp.metadata();

        expect(imageMetadata).to.have.property('width', 768);
        expect(imageMetadata).to.have.property('height', 1024);
        expect(imageMetadata).to.have.property('format', 'png');
      });
    });
  });
});
