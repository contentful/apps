import { describe, it, expect } from 'vitest';
import { getEntryFieldValue, renderFieldValue } from '../../../src/locations/Page/utils/entryUtils';
import { ContentTypeField } from '../../../src/locations/Page/types';

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

  describe('renderFieldValue', () => {
    it('returns truncated string for Symbol field with string value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Symbol' } as ContentTypeField;
      const result = renderFieldValue(field, 'This is a long string that should be truncated');
      expect(result).toBe('This is a long strin ...');
    });

    it('returns truncated string for Text field with string value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Text' } as ContentTypeField;
      const result = renderFieldValue(field, 'This is a text field with long content');
      expect(result).toBe('This is a text field ...');
    });

    it('returns truncated string for Integer field with number value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Integer' } as ContentTypeField;
      const result = renderFieldValue(field, 42);
      expect(result).toBe('42');
    });

    it('returns truncated string for Number field with decimal value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Number' } as ContentTypeField;
      const result = renderFieldValue(field, 3.14159);
      expect(result).toBe('3.14159');
    });

    it('returns truncated string for Date field with date value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Date' } as ContentTypeField;
      const dateValue = '2023-12-25';
      const result = renderFieldValue(field, dateValue);
      expect(result).toBe('2023-12-25');
    });

    it('returns location string for Location field', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Location' } as ContentTypeField;
      const locationValue = { lat: 40.7128, lon: -74.006 };
      const result = renderFieldValue(field, locationValue);
      expect(result).toBe('Lat: 40.7128, Lon: - ...');
    });

    it('returns "true" for Boolean field with true value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Boolean' } as ContentTypeField;
      const result = renderFieldValue(field, true);
      expect(result).toBe('true');
    });

    it('returns truncated JSON string for Object field', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Object' } as ContentTypeField;
      const objectValue = { name: 'John', age: 30, city: 'New York' };
      const result = renderFieldValue(field, objectValue);
      expect(result).toBe('{"name":"John","age" ...');
    });

    it('returns the truncated html string of a rich text field', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'RichText' } as ContentTypeField;
      const richTextValue = {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            data: {},
            content: [
              {
                nodeType: 'text',
                value: 'this is a test value',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const result = renderFieldValue(field, richTextValue);

      expect(result).toBe('<p>this is a test va ...');
    });

    it('returns "1 asset" for Link field with Asset reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Link' } as ContentTypeField;
      const linkValue = { sys: { linkType: 'Asset' } };
      const result = renderFieldValue(field, linkValue);
      expect(result).toBe('1 asset');
    });

    it('returns "1 reference field" for Link field with Entry reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Link' } as ContentTypeField;
      const linkValue = { sys: { linkType: 'Entry' } };
      const result = renderFieldValue(field, linkValue);
      expect(result).toBe('1 reference field');
    });

    it('returns "1 reference field" for Array field with single Entry reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [{ sys: { linkType: 'Entry' } }];
      const result = renderFieldValue(field, arrayValue);
      expect(result).toBe('1 reference field');
    });

    it('returns "2 reference fields" for Array field with multiple Entry references', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [{ sys: { linkType: 'Entry' } }, { sys: { linkType: 'Entry' } }];
      const result = renderFieldValue(field, arrayValue);
      expect(result).toBe('2 reference fields');
    });

    it('returns "1 asset" for Array field with single Asset reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [{ sys: { linkType: 'Asset' } }];
      const result = renderFieldValue(field, arrayValue);
      expect(result).toBe('1 asset');
    });

    it('returns "3 assets" for Array field with multiple Asset references', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [
        { sys: { linkType: 'Asset' } },
        { sys: { linkType: 'Asset' } },
        { sys: { linkType: 'Asset' } },
      ];
      const result = renderFieldValue(field, arrayValue);
      expect(result).toBe('3 assets');
    });

    it('returns truncated string for Array field with string values', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = ['apple', 'banana', 'cherry'];
      const result = renderFieldValue(field, arrayValue);
      expect(result).toBe('apple, banana, cherr ...');
    });

    it('returns "-" for undefined value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Symbol' } as ContentTypeField;
      const result = renderFieldValue(field, undefined);
      expect(result).toBe('-');
    });

    it('returns "-" for null value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Symbol' } as ContentTypeField;
      const result = renderFieldValue(field, null);
      expect(result).toBe('-');
    });

    it('returns truncated string for empty array', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const result = renderFieldValue(field, []);
      expect(result).toBe('');
    });
  });
});
