import sharp from 'sharp';
import {
  absolutePathToFile,
  findColorProportion,
  responseFromFile,
  writeFiles,
} from '../test/utils';
import { BAR_COLOR, ERASE_COLOR, ImageTransformer } from './transform-images';
import { expect } from 'chai';

describe('ImageTransformer', () => {
  describe('#execute', () => {
    let transformImages: ImageTransformer;

    describe('when image is square', () => {
      beforeEach(async () => {
        const maskPath = absolutePathToFile('./test/mocks/images/peaceful-cat-mask.png');
        const sourceImagePath = absolutePathToFile('./test/mocks/images/peaceful-cat.jpg');
        const maskImageResponse = await responseFromFile(maskPath);
        const sourceImageResponse = await responseFromFile(sourceImagePath);
        transformImages = new ImageTransformer(sourceImageResponse, maskImageResponse);
      });

      it('returns images that have been transformed to the correct format', async () => {
        const result = await transformImages.execute();
        const { image, mask } = result;
        const imageSharp = sharp(image, { failOn: 'none' });
        const maskSharp = sharp(mask, { failOn: 'none' });

        // write file artifacts to tmp folder for testing
        await writeFiles({ imageSharp, maskSharp }, 'square');

        const imageMetadata = await imageSharp.metadata();
        const maskMetadata = await maskSharp.metadata();

        // source image
        expect(imageMetadata).to.have.property('width', 1024);
        expect(imageMetadata).to.have.property('height', 1024);
        expect(imageMetadata).to.have.property('format', 'png');

        // mask image
        expect(maskMetadata).to.have.property('width', 1024);
        expect(maskMetadata).to.have.property('height', 1024);
        expect(maskMetadata).to.have.property('format', 'png');

        // make sure that we swapped out an appropriate percentage of pixels with transparent pixels
        const transparentPixelProportion = await findColorProportion(
          maskSharp,
          { ...ERASE_COLOR, alpha: 0 },
          { compareAlpha: true }
        );
        expect(transparentPixelProportion).to.be.within(0.6, 0.65);
      });
    });

    describe('when image is landscape', async () => {
      beforeEach(async () => {
        const maskPath = absolutePathToFile('./test/mocks/images/peaceful-cat-landscape-mask.png');
        const maskImageResponse = await responseFromFile(maskPath);
        const sourceImagePath = absolutePathToFile(
          './test/mocks/images/peaceful-cat-landscape.png'
        );
        const sourceImageResponse = await responseFromFile(sourceImagePath);
        transformImages = new ImageTransformer(sourceImageResponse, maskImageResponse);
      });

      it('returns images that have been transformed to the correct format', async () => {
        const result = await transformImages.execute();
        const { image, mask } = result;
        const imageSharp = sharp(image, { failOn: 'none' });
        const maskSharp = sharp(mask, { failOn: 'none' });

        // check that top and bottom black bars are where we expect them
        // source image is 1487x1066, resized the image will be 1024x734
        // thus we expect black bars of 1024x145 on both top and bottom
        const top = imageSharp.clone().extract({ left: 0, top: 0, width: 1024, height: 145 });
        const bottom = imageSharp
          .clone()
          .extract({ left: 0, top: 734 + 145, width: 1024, height: 145 });

        // write file artifacts to tmp folder for testing
        await writeFiles({ imageSharp, maskSharp, top, bottom }, 'landscape');

        const imageMetadata = await imageSharp.metadata();
        const maskMetadata = await maskSharp.metadata();

        // source image
        expect(imageMetadata).to.have.property('width', 1024);
        expect(imageMetadata).to.have.property('height', 1024);
        expect(imageMetadata).to.have.property('format', 'png');

        // mask image
        expect(maskMetadata).to.have.property('width', 1024);
        expect(maskMetadata).to.have.property('height', 1024);
        expect(maskMetadata).to.have.property('format', 'png');

        const topBarColorProportion = await findColorProportion(top, BAR_COLOR);
        const bottomBarColorProportion = await findColorProportion(bottom, BAR_COLOR);

        expect(topBarColorProportion).to.eq(1);
        expect(bottomBarColorProportion).to.eq(1);
      });
    });

    describe('when image is portrait', async () => {
      beforeEach(async () => {
        const maskPath = absolutePathToFile('./test/mocks/images/peaceful-cat-portrait-mask.png');
        const maskImageResponse = await responseFromFile(maskPath);
        const sourceImagePath = absolutePathToFile('./test/mocks/images/peaceful-cat-portrait.jpg');
        const sourceImageResponse = await responseFromFile(sourceImagePath);
        transformImages = new ImageTransformer(sourceImageResponse, maskImageResponse);
      });

      it('returns images that have been transformed to the correct format', async () => {
        const result = await transformImages.execute();
        const { image, mask } = result;
        const imageSharp = sharp(image, { failOn: 'none' });
        const maskSharp = sharp(mask, { failOn: 'none' });

        // check that left and right black bars are where we expect them
        // source image is 1500x2000, resized the image will be 768x1024
        // thus we expect black bars of 128x1024 on both sides
        const leftSide = imageSharp.clone().extract({ left: 0, top: 0, width: 128, height: 1024 });
        const rightSide = imageSharp
          .clone()
          .extract({ left: 128 + 768, top: 0, width: 128, height: 1024 });

        // write file artifacts to tmp folder for testing
        await writeFiles({ imageSharp, maskSharp, leftSide, rightSide }, 'portrait');

        const imageMetadata = await imageSharp.metadata();
        const maskMetadata = await maskSharp.metadata();

        // source image
        expect(imageMetadata).to.have.property('width', 1024);
        expect(imageMetadata).to.have.property('height', 1024);
        expect(imageMetadata).to.have.property('format', 'png');

        // mask image
        expect(maskMetadata).to.have.property('width', 1024);
        expect(maskMetadata).to.have.property('height', 1024);
        expect(maskMetadata).to.have.property('format', 'png');

        const leftSideBarColorProportion = await findColorProportion(leftSide, BAR_COLOR);
        const rightSideBarColorProportion = await findColorProportion(rightSide, BAR_COLOR);

        expect(leftSideBarColorProportion).to.eq(1);
        expect(rightSideBarColorProportion).to.eq(1);
      });
    });
  });
});
