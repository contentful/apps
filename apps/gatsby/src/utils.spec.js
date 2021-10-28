import { isValidUrl } from './utils';

describe('isValidUrl', () => {
  it('returns true for valid urls', () => {
    const urls = [
      'http://hello.com',
      'https://gatsbyjs.com/content-sync/4930494-d90934823-lsef987-dseefef',
      'http://a-nice-gatsby-site.gatsbyjs.io',
    ];

    urls.forEach((url) => {
      expect(isValidUrl(url)).toEqual(true);
    });
  });

  it('returns false if the url does not contain http(s) protocol', () => {
    expect(isValidUrl('another-nice-site.gatsbyjs.io')).toEqual(false);
  });

  it('returns false for invalid urls', () => {
    const urls = ['http://hello', 'http://a-nice-gats`by-site.gatsbyjs.io', 'http://hell"o.com'];

    urls.forEach((url) => {
      expect(isValidUrl(url)).toEqual(false);
    });
  });
});
