import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchEntriesWithBatching,
  getEntryFieldValue,
  mapContentTypePropsToFields,
  processEntriesInBatches,
  getFieldDisplayValue,
} from '../../../src/locations/Page/utils/entryUtils';
import { ContentTypeField } from '../../../src/locations/Page/types';
import { ContentTypeProps, EntryProps } from 'contentful-management';
import { mockSdk } from '../../mocks';

// Helper function to create test content types
const createTestContentType = (fields: any[]): ContentTypeProps => ({
  sys: {
    id: 'test-content-type',
    type: 'ContentType',
    version: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    space: { sys: { type: 'Link', linkType: 'Space', id: 'space-id' } },
    environment: { sys: { type: 'Link', linkType: 'Environment', id: 'master' } },
  },
  name: 'Test Content Type',
  description: 'Test description',
  displayField: fields[0]?.id || 'title',
  fields,
});

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

    it('returns number representation when field value is a number', () => {
      const entry = { fields: { testField: { 'en-US': 123 } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe(123);
    });

    it('returns boolean representation when field value is a boolean', () => {
      const entry = { fields: { testField: { 'en-US': true } } };
      const result = getEntryFieldValue(entry, field, defaultLocale);
      expect(result).toBe(true);
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

  describe('getFieldDisplayValue', () => {
    it('returns truncated string for Symbol field with string value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Symbol' } as ContentTypeField;
      const result = getFieldDisplayValue(
        field,
        'This is a long string that should be truncated',
        20
      );
      expect(result).toBe('This is a long strin ...');
    });

    it('returns truncated string for Text field with string value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Text' } as ContentTypeField;
      const result = getFieldDisplayValue(field, 'This is a text field with long content', 20);
      expect(result).toBe('This is a text field ...');
    });

    it('returns truncated string for Integer field with number value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Integer' } as ContentTypeField;
      const result = getFieldDisplayValue(field, 42, 20);
      expect(result).toBe('42');
    });

    it('returns truncated string for Number field with decimal value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Number' } as ContentTypeField;
      const result = getFieldDisplayValue(field, 3.14159, 20);
      expect(result).toBe('3.14159');
    });

    it('returns truncated string for Date field with date value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Date' } as ContentTypeField;
      const dateValue = '2023-12-25';
      const result = getFieldDisplayValue(field, dateValue, 20);
      expect(result).toBe('2023-12-25');
    });

    it('returns location string for Location field', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Location' } as ContentTypeField;
      const locationValue = { lat: 40.7128, lon: -74.006 };
      const result = getFieldDisplayValue(field, locationValue, 20);
      expect(result).toBe('Lat: 40.7128, Lon: - ...');
    });

    it('returns "true" for Boolean field with true value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Boolean' } as ContentTypeField;
      const result = getFieldDisplayValue(field, true, 20);
      expect(result).toBe('true');
    });

    it('returns truncated JSON string for Object field', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Object' } as ContentTypeField;
      const objectValue = { name: 'John', age: 30, city: 'New York' };
      const result = getFieldDisplayValue(field, objectValue, 20);
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

      const result = getFieldDisplayValue(field, richTextValue, 20);

      expect(result).toBe('<p>this is a test va ...');
    });

    it('returns "1 asset" for Link field with Asset reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Link' } as ContentTypeField;
      const linkValue = { sys: { linkType: 'Asset' } };
      const result = getFieldDisplayValue(field, linkValue, 20);
      expect(result).toBe('1 asset');
    });

    it('returns "1 reference field" for Link field with Entry reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Link' } as ContentTypeField;
      const linkValue = { sys: { linkType: 'Entry' } };
      const result = getFieldDisplayValue(field, linkValue, 20);
      expect(result).toBe('1 reference field');
    });

    it('returns "1 reference field" for Array field with single Entry reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [{ sys: { linkType: 'Entry' } }];
      const result = getFieldDisplayValue(field, arrayValue, 20);
      expect(result).toBe('1 reference field');
    });

    it('returns "2 reference fields" for Array field with multiple Entry references', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [{ sys: { linkType: 'Entry' } }, { sys: { linkType: 'Entry' } }];
      const result = getFieldDisplayValue(field, arrayValue, 20);
      expect(result).toBe('2 reference fields');
    });

    it('returns "1 asset" for Array field with single Asset reference', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [{ sys: { linkType: 'Asset' } }];
      const result = getFieldDisplayValue(field, arrayValue, 20);
      expect(result).toBe('1 asset');
    });

    it('returns "3 assets" for Array field with multiple Asset references', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = [
        { sys: { linkType: 'Asset' } },
        { sys: { linkType: 'Asset' } },
        { sys: { linkType: 'Asset' } },
      ];
      const result = getFieldDisplayValue(field, arrayValue, 20);
      expect(result).toBe('3 assets');
    });

    it('returns truncated string for Array field with string values', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const arrayValue = ['apple', 'banana', 'cherry'];
      const result = getFieldDisplayValue(field, arrayValue, 20);
      expect(result).toBe('apple, banana, cherr ...');
    });

    it('returns "-" for undefined value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Symbol' } as ContentTypeField;
      const result = getFieldDisplayValue(field, undefined, 20);
      expect(result).toBe('-');
    });

    it('returns "-" for null value', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Symbol' } as ContentTypeField;
      const result = getFieldDisplayValue(field, null, 20);
      expect(result).toBe('-');
    });

    it('returns truncated string for empty array', () => {
      const field = { id: 'testField', locale: 'en-US', type: 'Array' } as ContentTypeField;
      const result = getFieldDisplayValue(field, [], 20);
      expect(result).toBe('');
    });
  });

  describe('processEntriesInBatches', () => {
    const mockUpdateFunction = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should process entries in batches', async () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        sys: { id: `entry-${i}` } as any,
        fields: {},
      }));
      const batchSize = 3;
      const delayMs = 200;

      const processPromise = processEntriesInBatches(
        entries,
        mockUpdateFunction,
        batchSize,
        delayMs
      );

      // Fast-forward time to complete all batches
      await vi.runAllTimersAsync();

      const results = await processPromise;

      expect(mockUpdateFunction).toHaveBeenCalledTimes(10);
      expect(results).toHaveLength(10);
    });

    it('should handle empty entries array', async () => {
      const results = await processEntriesInBatches([], mockUpdateFunction, 3, 200);

      expect(mockUpdateFunction).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });

    it('should handle single batch', async () => {
      const entries = Array.from({ length: 2 }, (_, i) => ({
        sys: { id: `entry-${i}` } as any,
        fields: {},
      }));
      const batchSize = 5;

      const processPromise = processEntriesInBatches(entries, mockUpdateFunction, batchSize, 200);

      await vi.runAllTimersAsync();
      const results = await processPromise;

      expect(mockUpdateFunction).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it('should simulate realistic entry updates with delays', async () => {
      const mockEntries = [
        { sys: { id: 'entry-1' }, fields: {} },
        { sys: { id: 'entry-2' }, fields: {} },
        { sys: { id: 'entry-3' }, fields: {} },
        { sys: { id: 'entry-4' }, fields: {} },
        { sys: { id: 'entry-5' }, fields: {} },
        { sys: { id: 'entry-6' }, fields: {} },
      ];

      let callCount = 0;
      const mockUpdateFunction = vi.fn().mockImplementation(async (entry) => {
        callCount++;
        // Simulate some processing time
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, entry };
      });

      const batchSize = 2;
      const delayMs = 200;

      const processPromise = processEntriesInBatches(
        mockEntries as EntryProps[],
        mockUpdateFunction,
        batchSize,
        delayMs
      );

      // Fast-forward time to complete all batches
      await vi.runAllTimersAsync();

      const results = await processPromise;

      expect(mockUpdateFunction).toHaveBeenCalledTimes(6);
      expect(results).toHaveLength(6);
      expect(results.every((r: any) => r.success)).toBe(true);
    });

    it('should handle large numbers of entries efficiently', async () => {
      const largeEntryArray = Array.from({ length: 150 }, (_, i) => ({
        sys: { id: `entry-${i}` },
        fields: {},
      }));

      const mockUpdateFunction = vi.fn().mockImplementation(async (entry) => {
        return { success: true, entry };
      });

      const batchSize = 10;
      const delayMs = 200;

      const processPromise = processEntriesInBatches(
        largeEntryArray as EntryProps[],
        mockUpdateFunction,
        batchSize,
        delayMs
      );

      await vi.runAllTimersAsync();
      const results = await processPromise;

      expect(mockUpdateFunction).toHaveBeenCalledTimes(150);
      expect(results).toHaveLength(150);
      expect(results.every((r: any) => r.success)).toBe(true);
    });
  });

  describe('processEntriesInBatches', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('processes entries correctly with batching and delays', async () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        sys: { id: `entry-${i}` } as any,
        fields: {},
      }));
      const mockUpdateFunction = vi.fn().mockResolvedValue({ success: true });

      const processPromise = processEntriesInBatches(entries, mockUpdateFunction, 3, 200);
      await vi.runAllTimersAsync();
      const results = await processPromise;

      expect(mockUpdateFunction).toHaveBeenCalledTimes(10);
      expect(results).toHaveLength(10);
    });

    it('handles edge cases', async () => {
      const mockUpdateFunction = vi.fn();

      // Empty array
      const emptyResults = await processEntriesInBatches([], mockUpdateFunction, 3, 200);
      expect(emptyResults).toHaveLength(0);
      expect(mockUpdateFunction).not.toHaveBeenCalled();
    });
  });

  describe('fetchEntriesWithBatching', () => {
    const mockSdk = {
      cma: {
        entry: {
          getMany: vi.fn(),
        },
      },
      ids: {
        space: 'test-space',
        environment: 'test-environment',
      },
    };
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('fetches entries with batching and error handling', async () => {
      // Mock successful batch responses
      mockSdk.cma.entry.getMany
        .mockResolvedValueOnce({
          items: Array.from({ length: 100 }, (_, i) => ({
            sys: { id: `entry-${i}`, type: 'Entry' },
            fields: { title: { 'en-US': `Entry ${i}` } },
          })),
          total: 250,
        })
        .mockResolvedValueOnce({
          items: Array.from({ length: 50 }, (_, i) => ({
            sys: { id: `entry-${i + 100}`, type: 'Entry' },
            fields: { title: { 'en-US': `Entry ${i + 100}` } },
          })),
          total: 250,
        });

      const query = { content_type: 'test-content-type', skip: 0, limit: 250 };
      const result = await fetchEntriesWithBatching(mockSdk, query, 100);

      expect(result.entries).toHaveLength(150);
      expect(result.total).toBe(250);
      expect(mockSdk.cma.entry.getMany).toHaveBeenCalledTimes(2);
    });

    it('should handle response size errors by reducing batch size', async () => {
      // Mock response size error on first call
      mockSdk.cma.entry.getMany.mockRejectedValueOnce({
        message: 'Response size too big. Maximum allowed response size: 7340032B.',
      });

      // Mock successful response with smaller batch size
      mockSdk.cma.entry.getMany.mockResolvedValueOnce({
        items: Array.from({ length: 50 }, (_, i) => ({
          sys: { id: `entry-${i}`, type: 'Entry' },
          fields: { title: { 'en-US': `Entry ${i}` } },
        })),
        total: 50,
      });

      const query = { content_type: 'test-content-type', skip: 0, limit: 50 };
      const result = await fetchEntriesWithBatching(mockSdk, query, 100);

      expect(result.entries).toHaveLength(50);
      expect(result.total).toBe(50);
      expect(mockSdk.cma.entry.getMany).toHaveBeenCalledTimes(2);
    });

    it('should handle empty results', async () => {
      mockSdk.cma.entry.getMany.mockResolvedValueOnce({
        items: [],
        total: 0,
      });

      const query = { content_type: 'test-content-type', skip: 0, limit: 100 };
      const result = await fetchEntriesWithBatching(mockSdk, query, 100);

      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(mockSdk.cma.entry.getMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('processContentTypeFields', () => {
    const mockLocales = ['en-US', 'es-ES'];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('creates Symbol field correctly for non-localized field', async () => {
      const expected = { id: 'title', name: 'Title', type: 'Symbol', items: undefined };
      const mockContentType = createTestContentType([
        {
          ...expected,
          localized: false,
          required: false,
        },
      ]);

      mockSdk.cma.contentType.get.mockResolvedValue(mockContentType);

      const ct = await mockSdk.cma.contentType.get({ contentTypeId: 'test-content-type' });
      const result = mapContentTypePropsToFields(ct.fields, mockLocales);

      expect(mockSdk.cma.contentType.get).toHaveBeenCalledWith({
        contentTypeId: 'test-content-type',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ ...expected, uniqueId: 'title' });
    });

    it('creates localized Symbol field correctly', async () => {
      const expected = { id: 'description', name: 'Description', type: 'Symbol', items: undefined };
      const mockContentType = createTestContentType([
        {
          ...expected,
          localized: true,
          required: false,
        },
      ]);

      mockSdk.cma.contentType.get.mockResolvedValue(mockContentType);

      const ct = await mockSdk.cma.contentType.get({ contentTypeId: 'test-content-type' });
      const result = mapContentTypePropsToFields(ct.fields, mockLocales);

      expect(mockSdk.cma.contentType.get).toHaveBeenCalledWith({
        contentTypeId: 'test-content-type',
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...expected,
        uniqueId: 'description-en-US',
        locale: 'en-US',
      });
      expect(result[1]).toEqual({
        ...expected,
        uniqueId: 'description-es-ES',
        locale: 'es-ES',
      });
    });

    it('creates Array field with Symbol items correctly', async () => {
      const expected = {
        id: 'tags',
        name: 'Tags',
        type: 'Array',
        items: {
          type: 'Symbol',
          validations: [],
        },
      };
      const mockContentType = createTestContentType([
        {
          ...expected,
          localized: false,
          required: false,
        },
      ]);

      mockSdk.cma.contentType.get.mockResolvedValue(mockContentType);

      const ct = await mockSdk.cma.contentType.get({ contentTypeId: 'test-content-type' });
      const result = mapContentTypePropsToFields(ct.fields, mockLocales);

      expect(mockSdk.cma.contentType.get).toHaveBeenCalledWith({
        contentTypeId: 'test-content-type',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...expected,
        uniqueId: 'tags',
      });
    });

    it('creates Array field with Link items correctly', async () => {
      const expected = {
        id: 'relatedEntries',
        name: 'Related Entries',
        type: 'Array',
        items: {
          type: 'Link',
          linkType: 'Entry',
          validations: [],
        },
      };
      const mockContentType = createTestContentType([
        {
          ...expected,
          localized: false,
          required: false,
        },
      ]);

      mockSdk.cma.contentType.get.mockResolvedValue(mockContentType);

      const ct = await mockSdk.cma.contentType.get({ contentTypeId: 'test-content-type' });
      const result = mapContentTypePropsToFields(ct.fields, mockLocales);

      expect(mockSdk.cma.contentType.get).toHaveBeenCalledWith({
        contentTypeId: 'test-content-type',
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...expected,
        uniqueId: 'relatedEntries',
      });
    });
  });
});
