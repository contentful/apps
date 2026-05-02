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

    expect(reportSlug).toBe('/guides/market-insights/');
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

    expect(reportSlug).toBe('/north-america/denver/luxury-homes/');
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
