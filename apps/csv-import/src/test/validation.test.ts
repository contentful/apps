import { describe, it, expect } from 'vitest';
import { coerceFieldValue, validateFieldValue } from '../lib/validation';
import { FieldMeta } from '../lib/types';

describe('validation', () => {
  describe('coerceFieldValue', () => {
    it('should coerce Symbol/Text fields', () => {
      const field: FieldMeta = {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        localized: false,
        required: false,
      };

      expect(coerceFieldValue(field, '  test  ')).toBe('test');
      expect(coerceFieldValue(field, '')).toBe(null);
    });

    it('should coerce Number fields', () => {
      const field: FieldMeta = {
        id: 'count',
        name: 'Count',
        type: 'Number',
        localized: false,
        required: false,
      };

      expect(coerceFieldValue(field, '123')).toBe(123);
      expect(coerceFieldValue(field, '123.45')).toBe(123.45);
      expect(coerceFieldValue(field, 'invalid')).toBe(null);
    });

    it('should coerce Boolean fields', () => {
      const field: FieldMeta = {
        id: 'active',
        name: 'Active',
        type: 'Boolean',
        localized: false,
        required: false,
      };

      expect(coerceFieldValue(field, 'true')).toBe(true);
      expect(coerceFieldValue(field, 'false')).toBe(false);
      expect(coerceFieldValue(field, '1')).toBe(true);
      expect(coerceFieldValue(field, '0')).toBe(false);
    });
  });

  describe('validateFieldValue', () => {
    it('should validate required fields', () => {
      const field: FieldMeta = {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        localized: false,
        required: true,
      };

      const issues = validateFieldValue(field, '', 1, 'title');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('error');
      expect(issues[0].message).toContain('Required');
    });

    it('should validate field types', () => {
      const field: FieldMeta = {
        id: 'count',
        name: 'Count',
        type: 'Number',
        localized: false,
        required: false,
      };

      const issues = validateFieldValue(field, 'not a number' as any, 1, 'count');
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].severity).toBe('error');
    });

    it('should skip validation for empty optional fields', () => {
      const field: FieldMeta = {
        id: 'description',
        name: 'Description',
        type: 'Text',
        localized: false,
        required: false,
      };

      const issues = validateFieldValue(field, null, 1, 'description');
      expect(issues.length).toBe(0);
    });
  });
});
