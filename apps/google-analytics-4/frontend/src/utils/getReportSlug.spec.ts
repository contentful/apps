import { describe, expect, it } from 'vitest';
import { buildDefaultPathPattern, getReportSlug, pathPatternPreview } from './getReportSlug';

describe('getReportSlug', () => {
  it('supports advanced patterns with multiple field tokens', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        additionalFieldIds: ['sectionSlug'],
        pathPattern: '/{sectionSlug}/{slug}',
      },
      {
        slug: 'market-insights',
        sectionSlug: 'guides',
      },
      true
    );

    expect(reportSlug).toBe('/guides/market-insights');
  });

  it('supports deeper composed paths with multiple selected properties', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        additionalFieldIds: ['regionSlug', 'citySlug'],
        pathPattern: '/{regionSlug}/{citySlug}/{slug}',
      },
      {
        slug: 'luxury-homes',
        regionSlug: 'north-america',
        citySlug: 'denver',
      },
      true
    );

    expect(reportSlug).toBe('/north-america/denver/luxury-homes');
  });

  it('uses a locale-specific advanced pattern when one is configured', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        additionalFieldIds: ['sectionSlug'],
        pathPattern: '/products/{sectionSlug}/{slug}',
        enableLocalizedPathPatterns: true,
        localizedPathPatterns: {
          'de-DE': '/produkte/{sectionSlug}/{slug}',
        },
      },
      {
        slug: 'produkt',
        sectionSlug: 'vertragscloud',
      },
      true,
      'de-DE'
    );

    expect(reportSlug).toBe('/produkte/vertragscloud/produkt');
  });

  it('falls back to the base advanced pattern when a locale override is empty', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        pathPattern: '/products/{slug}',
        enableLocalizedPathPatterns: true,
        localizedPathPatterns: {
          'fr-FR': '',
        },
      },
      {
        slug: 'produit',
      },
      true,
      'fr-FR'
    );

    expect(reportSlug).toBe('/products/produit');
  });

  it('ignores locale-specific patterns when the override toggle is disabled', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        pathPattern: '/products/{slug}',
        enableLocalizedPathPatterns: false,
        localizedPathPatterns: {
          'de-DE': '/produkte/{slug}',
        },
      },
      {
        slug: 'produkt',
      },
      true,
      'de-DE'
    );

    expect(reportSlug).toBe('/products/produkt');
  });

  it('preserves an authored trailing slash in advanced patterns', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        pathPattern: '/interviews/{slug}/',
      },
      {
        slug: 'my-post',
      },
      false
    );

    expect(reportSlug).toBe('/interviews/my-post/');
  });

  it('does not apply the global trailing slash setting to advanced wildcard patterns', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        pathPattern: '/shop/products/{slug}/compare/*',
      },
      {
        slug: 'example-product',
      },
      true
    );

    expect(reportSlug).toBe('/shop/products/example-product/compare/*');
  });

  it('applies the global trailing slash setting to standard patterns', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '/blog/',
      },
      'my-post',
      true
    );

    expect(reportSlug).toBe('/blog/my-post/');
  });

  it('supports integer field tokens in advanced patterns', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        additionalFieldIds: ['articleId'],
        pathPattern: '/article?articleId={articleId}',
      },
      {
        slug: 'article-title',
        articleId: 360054483454,
      },
      true
    );

    expect(reportSlug).toBe('/article?articleId=360054483454');
  });

  it('does not append a trailing slash after query string patterns', () => {
    const reportSlug = getReportSlug(
      {
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: true,
        pathPattern: '/search/?category={slug}',
      },
      {
        slug: 'platform',
      },
      true
    );

    expect(reportSlug).toBe('/search/?category=platform');
  });

  it('builds previews for additional field tokens', () => {
    expect(pathPatternPreview('/{sectionSlug}/{slug}', ['sectionSlug'])).toBe(
      '/example-sectionSlug/example-slug'
    );
  });

  it('builds a default page-path pattern from the existing url prefix', () => {
    expect(buildDefaultPathPattern('/blog/')).toBe('/blog/{slug}');
  });

  it('builds a default page-path pattern with selected path segments', () => {
    expect(buildDefaultPathPattern('', ['regionSlug', 'citySlug'])).toBe(
      '/{regionSlug}/{citySlug}/{slug}'
    );
  });

  it('builds a default query-string pattern when extra fields are selected', () => {
    expect(buildDefaultPathPattern('/search', ['category'], 'pagePathPlusQueryString')).toBe(
      '/search/{slug}?category={category}'
    );
  });

  it('builds a default advanced pattern without {slug} when no slug token is provided', () => {
    expect(buildDefaultPathPattern('', ['title'], 'unifiedPagePathScreen', '')).toBe('/{title}');
  });
});
