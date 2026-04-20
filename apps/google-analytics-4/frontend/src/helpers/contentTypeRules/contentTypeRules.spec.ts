import { describe, expect, it } from 'vitest';
import { normalizeContentTypeRules } from './contentTypeRules';

describe('contentTypeRules normalization', () => {
  it('marks legacy advanced-looking content type rules as advanced', () => {
    const [rule] = normalizeContentTypeRules([
      {
        id: 'legacy-rule',
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
});
