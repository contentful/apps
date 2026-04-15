import { normalizeDomainPattern, urlMatchesAnyDomainPattern } from '@/utils/domainPatterns';

describe('normalizeDomainPattern', () => {
  it('normalizes bare hostnames and URLs to lowercase hostnames', () => {
    expect(normalizeDomainPattern('CONTENTFUL.com')).toBe('contentful.com');
    expect(normalizeDomainPattern('https://www.contentful.com/help')).toBe('www.contentful.com');
  });
});

describe('urlMatchesAnyDomainPattern', () => {
  it('matches an exact hostname', () => {
    expect(urlMatchesAnyDomainPattern('https://contentful.com/docs', ['contentful.com'])).toBe(
      true
    );
  });

  it('matches subdomains of an allowed hostname', () => {
    expect(urlMatchesAnyDomainPattern('https://www.contentful.com/help', ['contentful.com'])).toBe(
      true
    );
  });

  it('does not match spoofed hostnames that only contain the pattern', () => {
    expect(
      urlMatchesAnyDomainPattern('https://contentful.com.evil.test/path', ['contentful.com'])
    ).toBe(false);
  });

  it('does not match query-string bait that contains the pattern', () => {
    expect(
      urlMatchesAnyDomainPattern('https://evil.test/?next=contentful.com', ['contentful.com'])
    ).toBe(false);
  });
});
