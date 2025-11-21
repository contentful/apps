import { describe, it, expect } from 'vitest';
import { parseBoolean, parseNumber, chunk, unique, extractLocaleFromFieldName } from '../lib/utils';

describe('utils', () => {
  describe('parseBoolean', () => {
    it('should parse truthy values', () => {
      expect(parseBoolean('true')).toBe(true);
      expect(parseBoolean('TRUE')).toBe(true);
      expect(parseBoolean('1')).toBe(true);
      expect(parseBoolean('yes')).toBe(true);
      expect(parseBoolean('YES')).toBe(true);
      expect(parseBoolean('y')).toBe(true);
      expect(parseBoolean('on')).toBe(true);
    });

    it('should parse falsy values', () => {
      expect(parseBoolean('false')).toBe(false);
      expect(parseBoolean('FALSE')).toBe(false);
      expect(parseBoolean('0')).toBe(false);
      expect(parseBoolean('no')).toBe(false);
      expect(parseBoolean('NO')).toBe(false);
      expect(parseBoolean('n')).toBe(false);
      expect(parseBoolean('off')).toBe(false);
      expect(parseBoolean('')).toBe(false);
    });

    it('should return null for invalid values', () => {
      expect(parseBoolean('invalid')).toBe(null);
      expect(parseBoolean('maybe')).toBe(null);
    });
  });

  describe('parseNumber', () => {
    it('should parse valid numbers', () => {
      expect(parseNumber('123')).toBe(123);
      expect(parseNumber('123.45')).toBe(123.45);
      expect(parseNumber('-123')).toBe(-123);
      expect(parseNumber('  42  ')).toBe(42);
    });

    it('should return null for invalid numbers', () => {
      expect(parseNumber('abc')).toBe(null);
      expect(parseNumber('')).toBe(null);
      expect(parseNumber('  ')).toBe(null);
    });
  });

  describe('chunk', () => {
    it('should chunk array into specified sizes', () => {
      const array = [1, 2, 3, 4, 5, 6, 7];
      expect(chunk(array, 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
      expect(chunk(array, 2)).toEqual([[1, 2], [3, 4], [5, 6], [7]]);
    });

    it('should handle empty arrays', () => {
      expect(chunk([], 5)).toEqual([]);
    });
  });

  describe('unique', () => {
    it('should return unique values', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty arrays', () => {
      expect(unique([])).toEqual([]);
    });
  });

  describe('extractLocaleFromFieldName', () => {
    it('should extract locale from field name with suffix', () => {
      expect(extractLocaleFromFieldName('title__en-US')).toEqual({
        fieldId: 'title',
        locale: 'en-US',
      });
      expect(extractLocaleFromFieldName('description__de-DE')).toEqual({
        fieldId: 'description',
        locale: 'de-DE',
      });
    });

    it('should return null locale for field name without suffix', () => {
      expect(extractLocaleFromFieldName('title')).toEqual({
        fieldId: 'title',
        locale: null,
      });
    });
  });
});
