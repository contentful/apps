import { parseRemToPxInt, parsePxToInt } from './parse-styling-token';

describe('parseStylingToken helper', () => {
  it('parses rem values to px integer values', () => {
    const remValue = '0.0625rem';
    const parsedValue = parseRemToPxInt(remValue);

    expect(parsedValue).toEqual(1);
  });

  it('parses px values to px integer values', () => {
    const pxValue = '20px';
    const parsedValue = parsePxToInt(pxValue);

    expect(parsedValue).toEqual(20);
  });
});
