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

    it('returns empty string when entry is null', () => {
      const result = getEntryFieldValue(null, field, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when entry is undefined', () => {
      const result = getEntryFieldValue(undefined, field, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when field is null', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const result = getEntryFieldValue(entry, null, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when field is undefined', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const result = getEntryFieldValue(entry, undefined, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when field.id is missing', () => {
      const entry = { fields: { testField: { 'en-US': 'test value' } } };
      const fieldWithoutId = { locale: 'en-US' };
      const result = getEntryFieldValue(entry, fieldWithoutId, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when field value is undefined', () => {
      const entry = { fields: { testField: { 'en-US': undefined } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when field value is null', () => {
      const entry = { fields: { testField: { 'en-US': null } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when field does not exist in entry', () => {
      const entry = { fields: { otherField: { 'en-US': 'test value' } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('');
    });

    it('returns empty string when locale does not exist in field', () => {
      const entry = { fields: { testField: { 'fr-FR': 'test value' } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('');
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

    it('returns empty string when toString() returns falsy value', () => {
      const entry = { fields: { testField: { 'en-US': '' } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe('');
    });
  });

  describe('renderFieldValue', () => {
    it('handles undefined value', () => {
      const field: ContentTypeField = {
        id: 'test',
        uniqueId: 'test',
        name: 'Test',
        type: 'Symbol',
      };
      const result = renderFieldValue(field, undefined);
      expect(result).toBe('-');
    });

    it('handles null value', () => {
      const field: ContentTypeField = {
        id: 'test',
        uniqueId: 'test',
        name: 'Test',
        type: 'Symbol',
      };
      const result = renderFieldValue(field, null);
      expect(result).toBe('-');
    });
  });

  describe('getEntryTitle', () => {
    const contentType: ContentTypeProps = { displayField: 'title' } as ContentTypeProps;
    const locale = 'en-US';

    it('returns "Untitled" when displayField is null', () => {
      const contentTypeWithoutDisplayField = { displayField: null } as ContentTypeProps;
      const entry: Entry = {
        sys: { id: '1', contentType: { sys: { id: 'test' } }, version: 1 },
        fields: { title: { 'en-US': 'Test Title' } },
      };
      const result = getEntryTitle(entry, contentTypeWithoutDisplayField, locale);
      expect(result).toBe('Untitled');
    });

    it('returns "Untitled" when field value is undefined', () => {
      const entry: Entry = {
        sys: { id: '1', contentType: { sys: { id: 'test' } }, version: 1 },
        fields: { title: { 'en-US': undefined } },
      };
      const result = getEntryTitle(entry, contentType, locale);
      expect(result).toBe('Untitled');
    });

    it('returns "Untitled" when field value is null', () => {
      const entry: Entry = {
        sys: { id: '1', contentType: { sys: { id: 'test' } }, version: 1 },
        fields: { title: { 'en-US': null } },
      };
      const result = getEntryTitle(entry, contentType, locale);
      expect(result).toBe('Untitled');
    });

    it('returns "Untitled" when field value is empty string', () => {
      const entry: Entry = {
        sys: { id: '1', contentType: { sys: { id: 'test' } }, version: 1 },
        fields: { title: { 'en-US': '' } },
      };
      const result = getEntryTitle(entry, contentType, locale);
      expect(result).toBe('Untitled');
    });
  });

  describe('getStatus', () => {
    it('returns Draft status when no published version', () => {
      const entry: Entry = {
        sys: { id: '1', contentType: { sys: { id: 'test' } }, version: 1 },
        fields: {},
      };
      const result = getStatus(entry);
      expect(result.label).toBe('Draft');
      expect(result.color).toBe('warning');
    });

    it('returns Changed status when version is 2+ ahead of published', () => {
      const entry: Entry = {
        sys: { id: '1', contentType: { sys: { id: 'test' } }, version: 3, publishedVersion: 1 },
        fields: {},
      };
      const result = getStatus(entry);
      expect(result.label).toBe('Changed');
      expect(result.color).toBe('primary');
    });

    it('returns Published status when version is 1 ahead of published', () => {
      const entry: Entry = {
        sys: { id: '1', contentType: { sys: { id: 'test' } }, version: 2, publishedVersion: 1 },
        fields: {},
      };
      const result = getStatus(entry);
      expect(result.label).toBe('Published');
      expect(result.color).toBe('positive');
    });
  });

  describe('isCheckboxAllowed', () => {
    it('returns false for restricted field types', () => {
      const restrictedTypes = [
        'Location',
        'Date',
        'Asset',
        'Array',
        'Link',
        'ResourceLink',
        'Boolean',
        'Object',
        'RichText',
      ];

      restrictedTypes.forEach((type) => {
        const field: ContentTypeField = {
          id: 'test',
          uniqueId: 'test',
          name: 'Test',
          type: type as any,
        };
        const result = isCheckboxAllowed(field);
        expect(result).toBe(false);
      });
    });

    it('returns true for allowed field types', () => {
      const allowedTypes = ['Symbol', 'Text', 'Number', 'Integer'];

      allowedTypes.forEach((type) => {
        const field: ContentTypeField = {
          id: 'test',
          uniqueId: 'test',
          name: 'Test',
          type: type as any,
        };
        const result = isCheckboxAllowed(field);
        expect(result).toBe(true);
      });
    });

    it('returns false when field type is undefined', () => {
      const field: ContentTypeField = { id: 'test', uniqueId: 'test', name: 'Test' };
      const result = isCheckboxAllowed(field);
      expect(result).toBe(false);
    });
  });
});
