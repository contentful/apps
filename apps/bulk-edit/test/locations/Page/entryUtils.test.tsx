import { describe, it, expect } from 'vitest';
import {
  getEntryFieldValue,
  renderFieldValue,
  getEntryTitle,
  getStatus,
  isCheckboxAllowed,
} from '../../../src/locations/Page/utils/entryUtils';
import { Entry, ContentTypeField } from '../../../src/locations/Page/types';
import { ContentTypeProps } from 'contentful-management';

describe('entryUtils', () => {
  describe('getEntryFieldValue', () => {
    const defaultLocale = 'en-US';
    const field = { id: 'testField', locale: 'en-US' };

    it('returns "empty field" when entry is null', () => {
      const result = getEntryFieldValue(null, field, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when entry is undefined', () => {
      const result = getEntryFieldValue(undefined, field, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when field is null', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const result = getEntryFieldValue(entry, null, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when field is undefined', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const result = getEntryFieldValue(entry, undefined, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when field.id is missing', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const fieldWithoutId = { locale: 'en-US' } as any;
      const result = getEntryFieldValue(entry, fieldWithoutId, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when field value is undefined', () => {
      const entry = { fields: { testField: { 'en-US': undefined } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when field value is null', () => {
      const entry = { fields: { testField: { 'en-US': null } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when field does not exist in entry', () => {
      const entry = { fields: { otherField: { 'en-US': 'test value' } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns "empty field" when locale does not exist in field', () => {
      const entry = { fields: { testField: { 'fr-FR': 'test value' } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('empty field');
    });

    it('returns string value when field value is a string', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('test value');
    });

    it('returns string representation when field value is a number', () => {
      const entry = { fields: { testField: { 'en-US': 123 } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('123');
    });

    it('returns string representation when field value is a boolean', () => {
      const entry = { fields: { testField: { 'en-US': true } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('true');
    });

    it('uses default locale when field locale is not specified', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const fieldWithoutLocale = { id: 'testField' };
      const result = getEntryFieldValue(entry, fieldWithoutLocale, defaultLocale);
      expect(result).toBe('test value');
    });

    it('uses field locale when specified', () => {
      const entry = { fields: { testField: { 'en-US': 'en value', 'fr-FR': 'fr value' } } };
      const fieldWithLocale = { id: 'testField', locale: 'fr-FR' };
      const result = getEntryFieldValue(entry, fieldWithLocale, defaultLocale);
      expect(result).toBe('fr value');
    });

    it('returns "empty field" when toString() returns falsy value', () => {
      const entry = { fields: { testField: { 'en-US': '' } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('empty field');
    });
  });
});
