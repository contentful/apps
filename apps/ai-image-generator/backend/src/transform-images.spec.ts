import sharp from 'sharp';
import { absolutePathToFile, responseFromFile } from '../test/mocks';
import { ERASE_COLOR, ImageTransformer } from './transform-images';
import { expect } from 'chai';
import { areEqualColors, toRGBA } from './utils';

describe('ImageTransformer', () => {
  describe('#execute', () => {
    let transformImages: ImageTransformer;

    beforeEach(async () => {
      const maskPath = absolutePathToFile('./test/mocks/images/peaceful-cat.jpg');
      const maskImageResponse = await responseFromFile(maskPath);
      const sourceImagePath = absolutePathToFile('./test/mocks/images/peaceful-cat-mask.png');
      const sourceImageResponse = await responseFromFile(sourceImagePath);
      transformImages = new ImageTransformer(maskImageResponse, sourceImageResponse);
    });

    it('returns images that have been transformed to the correct format', async () => {
      const result = await transformImages.execute();
      const { image, mask } = result;
      const imageSharp = sharp(image, { failOn: 'none' });
      const maskSharp = sharp(mask, { failOn: 'none' });
      const imageMetadata = await imageSharp.metadata();
      const maskMetadata = await maskSharp.metadata();

      // source image
      expect(imageMetadata).to.have.property('width', 1024);
      expect(imageMetadata).to.have.property('height', 1024);
      expect(imageMetadata).to.have.property('format', 'png');

      // mask image
      expect(maskMetadata).to.have.property('width', 1024);
      expect(maskMetadata).to.have.property('height', 1024);

      // fairly complicated test that walks through each pixel in the image
      const imagePixels = await maskSharp.raw().toBuffer();
      let transparentPixelsFound = 0;
      let originalColorsFound = 0;
      for (let i = 0; i < imagePixels.length; i += 4) {
        const imagePixel = toRGBA(imagePixels.subarray(i, i + 3));

        if (areEqualColors(imagePixel, ERASE_COLOR)) {
          // check if alpha is 0 ie is transparent
          if (imagePixel.alpha === 0) {
            transparentPixelsFound++;
          }
          originalColorsFound++;
        }
      }

      // check to make sure every pixel matching our erase color is now transparent
      expect(transparentPixelsFound).to.eq(originalColorsFound);
    });
  });
});
