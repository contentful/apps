import { isValidUrl } from './isVaildUrl';

describe('isValidUrl', () => {
  it('returns false if a vaild url is not provided', () => {
    const res = isValidUrl('http//cool.com');

    expect(res).toBe(false);
  });

  it('', () => {
    const res = isValidUrl('https://www.cool.com');

    expect(res).toBe(true);
  });
});
