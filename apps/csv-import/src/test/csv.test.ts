import { describe, it, expect } from 'vitest';
import { parseCSVString, getColumnNames, hasLocaleSuffix, parseColumnName } from '../lib/csv';

describe('csv', () => {
  describe('parseCSVString', () => {
    it('should parse CSV string into rows', () => {
      const csvString = 'name,age\nJohn,30\nJane,25';
      const rows = parseCSVString(csvString);

      expect(rows.length).toBe(2);
      expect(rows[0].rowIndex).toBe(1);
      expect(rows[0].raw).toEqual({ name: 'John', age: '30' });
      expect(rows[1].rowIndex).toBe(2);
      expect(rows[1].raw).toEqual({ name: 'Jane', age: '25' });
    });

    it('should handle empty CSV', () => {
      const rows = parseCSVString('');
      expect(rows.length).toBe(0);
    });
  });

  describe('getColumnNames', () => {
    it('should extract column names from rows', () => {
      const rows = [
        { rowIndex: 1, raw: { name: 'John', age: '30' } },
        { rowIndex: 2, raw: { name: 'Jane', age: '25' } },
      ];

      const columns = getColumnNames(rows);
      expect(columns).toEqual(['name', 'age']);
    });

    it('should return empty array for empty rows', () => {
      expect(getColumnNames([])).toEqual([]);
    });
  });

  describe('hasLocaleSuffix', () => {
    it('should detect locale suffix', () => {
      expect(hasLocaleSuffix('title__en-US')).toBe(true);
      expect(hasLocaleSuffix('description__de-DE')).toBe(true);
    });

    it('should return false for no suffix', () => {
      expect(hasLocaleSuffix('title')).toBe(false);
      expect(hasLocaleSuffix('title__')).toBe(false);
      expect(hasLocaleSuffix('title__en__US')).toBe(false);
    });
  });

  describe('parseColumnName', () => {
    it('should parse column name with locale suffix', () => {
      expect(parseColumnName('title__en-US')).toEqual({
        fieldId: 'title',
        locale: 'en-US',
      });
    });

    it('should parse column name without locale suffix', () => {
      expect(parseColumnName('title')).toEqual({
        fieldId: 'title',
        locale: null,
      });
    });
  });
});
