import { describe, expect, it } from 'vitest';
import { normalizeContentTypeRules } from './contentTypeRules';

describe('contentTypeRules normalization', () => {
  it('preserves an explicitly disabled advanced rule even when advanced values are present', () => {
    const [rule] = normalizeContentTypeRules([
      {
        id: 'saved-rule',
        contentTypeId: 'searchPage',
        slugField: 'slug',
        urlPrefix: '',
        enableAdvancedMatching: false,
        pathPattern: '/search/{slug}?category={category}',
        additionalFieldIds: ['category'],
        matchDimension: 'pagePathPlusQueryString',
        matchType: 'EXACT',
      },
    ]);

    expect(rule.enableAdvancedMatching).toBe(false);
    expect(rule.pathPattern).toBe('/search/{slug}?category={category}');
  });

  it('marks legacy advanced-looking content type rules as advanced', () => {
    const [rule] = normalizeContentTypeRules([
      {
        id: 'legacy-rule',
        contentTypeId: 'searchPage',
        slugField: 'slug',
        urlPrefix: '',
        pathPattern: '/search/{slug}?category={category}',
        additionalFieldIds: ['category'],
        matchDimension: 'pagePathPlusQueryString',
        matchType: 'EXACT',
      },
    ]);

    expect(rule.enableAdvancedMatching).toBe(true);
  });

  it('marks legacy advanced-looking content types as advanced', () => {
    const [rule] = normalizeContentTypeRules(undefined, {
      searchPage: {
        slugField: 'slug',
        urlPrefix: '',
        pathPattern: '/search/{slug}?category={category}',
        additionalFieldIds: ['category'],
        matchDimension: 'pagePathPlusQueryString',
        matchType: 'EXACT',
      },
    });

    expect(rule.enableAdvancedMatching).toBe(true);
  });

  it('infers regex matching from advanced patterns during normalization', () => {
    const [rule] = normalizeContentTypeRules([
      {
        id: 'regex-rule',
        contentTypeId: 'comparePage',
        slugField: '',
        urlPrefix: '',
        enableAdvancedMatching: true,
        pathPattern: '/shop/products/{slug}/compare/*',
        additionalFieldIds: ['slug'],
        matchDimension: 'unifiedPagePathScreen',
        matchType: 'EXACT',
      },
    ]);

    expect(rule.matchType).toBe('PARTIAL_REGEXP');
  });
});
