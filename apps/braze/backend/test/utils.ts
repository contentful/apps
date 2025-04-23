import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { Response } from 'node-fetch';
import { AreEqualColorOpts, areEqualColors, toRGBA } from '../src/utils';

// a little utility function that computes the proportion of pixels in a given image that equal the provided
// color. useful for testing
export async function findColorProportion(
  sharpImage: sharp.Sharp,
  color: sharp.RGBA,
  opts: AreEqualColorOpts = {}
): Promise<number> {
  let matchingPixelsFound = 0;
  let totalPixelsFound = 0;
  const imagePixels = await sharpImage.clone().ensureAlpha().raw().toBuffer();

  for (let i = 0; i < imagePixels.length; i += 4) {
    const imagePixel = toRGBA(imagePixels.subarray(i, i + 4));
    totalPixelsFound++;

    if (areEqualColors(imagePixel, color, opts)) {
      matchingPixelsFound++;
    }
  }
  return matchingPixelsFound / totalPixelsFound;
}

async function writeImageToTmpFolder(sharpImage: sharp.Sharp, filename: string) {
  const folder = '/tmp/artifacts/aiig-image-generator-backend';
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  const filePath = path.resolve(folder, `${filename}.png`);
  const png = sharpImage.png();
  await png.toFile(filePath);
}

/* `path` path to file, relative to project root */
export const readStreamForFile = (filePath: string): fs.ReadStream => {
  const absolutePath = absolutePathToFile(filePath);
  return fs.createReadStream(absolutePath);
};

export const absolutePathToFile = (filePath: string): string => {
  return path.resolve(process.cwd(), filePath);
};

export const arrayBufferFromFile = async (filepath: string): Promise<ArrayBuffer> => {
  const readStream = readStreamForFile(filepath);

  const buffers: any[] = [];
  for await (const data of readStream) {
    buffers.push(data);
  }
  return Buffer.concat(buffers);
};

export const readableStreamFromFile = async (filepath: string): Promise<NodeJS.ReadableStream> => {
  const buffer = await arrayBufferFromFile(filepath);
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export const responseFromFile = async (filepath: string): Promise<Response> => {
  const readableStream = await readableStreamFromFile(filepath);
  return new Response(readableStream);
};

export async function writeFiles(files: Record<string, sharp.Sharp>, prefix = 'test') {
  Object.entries(files).forEach(async ([filename, sharpImage]) => {
    await writeImageToTmpFolder(sharpImage, `${prefix}.${filename}`);
  });
}
