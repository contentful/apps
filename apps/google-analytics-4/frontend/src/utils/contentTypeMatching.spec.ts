import { describe, expect, it } from 'vitest';
import {
  convertWildcardPatternToRegex,
  getMissingSelectedPatternTokens,
  getUnknownPatternTokens,
  inferMatchTypeFromPattern,
} from './contentTypeMatching';

describe('contentTypeMatching', () => {
  it('infers flexible matching from wildcard syntax', () => {
    expect(inferMatchTypeFromPattern('/shop/products/{slug}/compare/*')).toBe('PARTIAL_REGEXP');
  });

  it('converts wildcard syntax to a GA4 regular expression', () => {
    expect(convertWildcardPatternToRegex('/shop/products/example/compare/*')).toBe(
      '/shop/products/example/compare/.*'
    );
  });

  it('escapes query-string punctuation when converting wildcard syntax', () => {
    expect(convertWildcardPatternToRegex('/search?category=*')).toBe('/search\\?category=.*');
  });

  it('allows the locale token in patterns', () => {
    expect(getUnknownPatternTokens('/{locale}/{slug}', [], 'slug')).toEqual([]);
  });

  it('returns selected field tokens that are missing from the pattern', () => {
    expect(
      getMissingSelectedPatternTokens('/shop/products/{slug}/compare/*', [
        'product_id',
        'variant_id',
      ])
    ).toEqual(['product_id', 'variant_id']);
  });

  it('allows selected field tokens anywhere in the pattern', () => {
    expect(
      getMissingSelectedPatternTokens('/shop/products/{product_id}?variant={variant_id}', [
        'product_id',
        'variant_id',
      ])
    ).toEqual([]);
  });

  it('continues to support legacy regex wildcard syntax', () => {
    expect(convertWildcardPatternToRegex('/shop/products/example/compare/.*')).toBe(
      '/shop/products/example/compare/.*'
    );
  });
});
