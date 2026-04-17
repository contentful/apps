import { describe, expect, it } from 'vitest';
import { getReportSlug, pathPatternPreview } from './getReportSlug';

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

  it('builds previews for additional field tokens', () => {
    expect(pathPatternPreview('/{sectionSlug}/{slug}', ['sectionSlug'])).toBe(
      '/example-sectionSlug/example-slug'
    );
  });
});
