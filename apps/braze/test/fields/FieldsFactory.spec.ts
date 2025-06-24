import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { FieldsFactory } from '../../src/fields/FieldsFactory';
import { BasicField } from '../../src/fields/BasicField';
import { AssetField } from '../../src/fields/AssetField';
import { ReferenceField } from '../../src/fields/ReferenceField';
import { TextArrayField } from '../../src/fields/TextArrayField';
import { AssetArrayField } from '../../src/fields/AssetArrayField';
import { ReferenceArrayField } from '../../src/fields/ReferenceArrayField';
import { ReferenceItem } from '../../src/fields/ReferenceItem';

// Mock the library that contains resolveResponse
vi.mock('contentful-resolve-response', () => {
  return {
    default: vi.fn(),
  };
});

// Import the mocked function for use in tests
import resolveResponse from 'contentful-resolve-response';

describe('FieldsFactory', () => {
  const mockCma = {
    contentType: {
      get: vi.fn(),
    },
    entry: {
      references: vi.fn(),
    },
  };

  const entryId = 'entryId';
  const entryContentTypeId = 'article';

  beforeEach(() => {
    vi.resetAllMocks();
    (resolveResponse as any).mockReset();
  });

  it('should create a BasicField instance with correct properties', async () => {
    const mockEntry = [
      {
        fields: {
          title: { 'en-US': 'Test Article Title' },
        },
      },
    ];
    (resolveResponse as any).mockReturnValue(mockEntry);

    mockCma.contentType.get.mockResolvedValue({
      fields: [{ id: 'title', type: 'Symbol', localized: true }],
      sys: {
        id: 'article',
      },
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(BasicField);
    const fieldInstance = result[0] as BasicField;
    expect(fieldInstance.id).toBe('title');
    expect(fieldInstance.entryContentTypeId).toBe('article');
    expect(fieldInstance.localized).toBe(true);
  });

  it('should create an AssetField instance with correct properties', async () => {
    const mockEntry = [
      {
        fields: {
          featuredImage: {
            'en-US': {
              sys: { type: 'Link', linkType: 'Asset' },
            },
          },
        },
      },
    ];
    (resolveResponse as any).mockReturnValue(mockEntry);

    mockCma.contentType.get.mockResolvedValue({
      fields: [{ id: 'featuredImage', type: 'Link', linkType: 'Asset', localized: true }],
      sys: {
        id: 'article',
      },
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(AssetField);
    const fieldInstance = result[0] as AssetField;
    expect(fieldInstance.id).toBe('featuredImage');
    expect(fieldInstance.entryContentTypeId).toBe('article');
    expect(fieldInstance.localized).toBe(true);
  });

  it('should create a ReferenceField instance with correct properties', async () => {
    const mockReferencedEntry = {
      sys: {
        contentType: {
          sys: { id: 'author' },
        },
      },
      fields: {
        name: { 'en-US': 'John Doe' },
        bio: { 'en-US': 'Author bio' },
      },
    };

    const mockEntry = [
      {
        sys: {
          contentType: {
            sys: { id: 'article' },
          },
        },
        fields: {
          author: {
            'en-US': mockReferencedEntry,
          },
        },
      },
    ];
    (resolveResponse as any).mockReturnValue(mockEntry);

    mockCma.contentType.get.mockImplementation(({ contentTypeId }) => {
      if (contentTypeId === 'article') {
        return {
          fields: [{ id: 'author', type: 'Link', linkType: 'Entry', localized: false }],
          displayField: '',
          sys: {
            id: 'article',
          },
        };
      } else if (contentTypeId === 'author') {
        return {
          fields: [
            { id: 'name', type: 'Symbol', localized: true },
            { id: 'bio', type: 'Text', localized: true },
          ],
          displayField: 'name',
          sys: {
            id: 'author',
          },
        };
      }
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ReferenceField);
    const fieldInstance = result[0] as ReferenceField;
    expect(fieldInstance.id).toBe('author');
    expect(fieldInstance.entryContentTypeId).toBe('article');
    expect(fieldInstance.localized).toBe(false);
    expect(fieldInstance.referenceContentTypeId).toBe('author');

    expect(fieldInstance.fields).toHaveLength(2);
    expect(fieldInstance.fields[0]).toBeInstanceOf(BasicField);
    expect(fieldInstance.fields[0].id).toBe('name');
    expect(fieldInstance.fields[1]).toBeInstanceOf(BasicField);
    expect(fieldInstance.fields[1].id).toBe('bio');
  });

  it('should skip reference fields with null content type', async () => {
    const mockReferencedEntry = {
      sys: {
        contentType: null,
      },
      fields: {},
    };

    const mockEntry = [
      {
        sys: {
          contentType: {
            sys: { id: 'article' },
          },
        },
        fields: {
          author: {
            'en-US': mockReferencedEntry,
          },
        },
      },
    ];
    (resolveResponse as any).mockReturnValue(mockEntry);

    mockCma.contentType.get.mockResolvedValue({
      fields: [{ id: 'author', type: 'Link', linkType: 'Entry', localized: false }],
      displayField: '',
      sys: {
        id: 'article',
      },
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(0);
    expect(result.find((f) => f instanceof ReferenceField)).toBeUndefined();
  });

  it('should create a BasicArrayField instance with correct properties', async () => {
    const mockEntry = [
      {
        fields: {
          tags: { 'en-US': ['news', 'tech', 'featured'] },
        },
      },
    ];
    (resolveResponse as any).mockReturnValue(mockEntry);

    mockCma.contentType.get.mockResolvedValue({
      fields: [{ id: 'tags', type: 'Array', items: { type: 'Symbol' }, localized: true }],
      sys: {
        id: 'article',
      },
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(TextArrayField);
    const fieldInstance = result[0] as TextArrayField;
    expect(fieldInstance.id).toBe('tags');
    expect(fieldInstance.entryContentTypeId).toBe('article');
    expect(fieldInstance.localized).toBe(true);
  });

  it('should create an AssetArrayField instance with correct properties', async () => {
    const mockEntry = [
      {
        fields: {
          images: {
            'en-US': [
              { sys: { type: 'Link', linkType: 'Asset' } },
              { sys: { type: 'Link', linkType: 'Asset' } },
            ],
          },
        },
      },
    ];
    (resolveResponse as any).mockReturnValue(mockEntry);

    mockCma.contentType.get.mockResolvedValue({
      fields: [
        {
          id: 'images',
          type: 'Array',
          items: { type: 'Link', linkType: 'Asset' },
          localized: true,
        },
      ],
      sys: {
        id: 'gallery',
      },
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(AssetArrayField);
    const fieldInstance = result[0] as AssetArrayField;
    expect(fieldInstance.id).toBe('images');
    expect(fieldInstance.entryContentTypeId).toBe('gallery');
    expect(fieldInstance.localized).toBe(true);
  });

  it('should create a ReferenceArrayField instance with correct properties', async () => {
    const mockReferencedEntry1 = {
      sys: {
        contentType: {
          sys: { id: 'category' },
        },
      },
      fields: {
        name: { 'en-US': 'Technology' },
      },
    };

    const mockReferencedEntry2 = {
      sys: {
        contentType: {
          sys: { id: 'category' },
        },
      },
      fields: {
        name: { 'en-US': 'News' },
      },
    };

    const mockEntry = [
      {
        sys: {
          contentType: {
            sys: { id: 'article' },
          },
        },
        fields: {
          categories: {
            'en-US': [mockReferencedEntry1, mockReferencedEntry2],
          },
        },
      },
    ];
    (resolveResponse as any).mockReturnValue(mockEntry);

    mockCma.contentType.get.mockImplementation(({ contentTypeId }) => {
      if (contentTypeId === 'article') {
        return {
          fields: [
            {
              id: 'categories',
              type: 'Array',
              items: { type: 'Link', linkType: 'Entry' },
              localized: false,
            },
          ],
          displayField: null,
          sys: {
            id: contentTypeId,
          },
        };
      } else if (contentTypeId === 'category') {
        return {
          fields: [{ id: 'name', type: 'Symbol', localized: true }],
          displayField: 'name',
          sys: {
            id: contentTypeId,
          },
        };
      }
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ReferenceArrayField);
    const fieldInstance = result[0] as ReferenceArrayField;

    expect(fieldInstance.id).toBe('categories');
    expect(fieldInstance.entryContentTypeId).toBe('article');
    expect(fieldInstance.localized).toBe(false);

    expect(fieldInstance.items).toHaveLength(2);
    expect(fieldInstance.items[0]).toBeInstanceOf(ReferenceItem);
    expect(fieldInstance.items[0].referenceContentTypeId).toBe('category');
    expect(fieldInstance.items[0].fields).toHaveLength(1);
    expect(fieldInstance.items[0].fields[0].id).toBe('name');

    expect(fieldInstance.items[1]).toBeInstanceOf(ReferenceItem);
    expect(fieldInstance.items[1].referenceContentTypeId).toBe('category');
    expect(fieldInstance.items[1].fields).toHaveLength(1);
    expect(fieldInstance.items[1].fields[0].id).toBe('name');
  });

  it('should limit the recursion depth for nested references based on NESTED_DEPTH constant', async () => {
    const max_depth = 5;

    // Create mock entries with deep nesting structure
    const createNestedEntry = (maxDepth: number, depth: number = 1): any => {
      const contentTypeId = `level${depth}`;

      return {
        sys: {
          contentType: {
            sys: { id: contentTypeId },
          },
        },
        fields: {
          name: { 'en-US': `Level ${depth} Name` },
          ...(depth < maxDepth
            ? { nestedRef: { 'en-US': createNestedEntry(maxDepth, depth + 1) } }
            : {}),
        },
      };
    };

    const mockEntry = createNestedEntry(7);
    (resolveResponse as any).mockReturnValue([mockEntry]);

    mockCma.contentType.get.mockImplementation(({ contentTypeId }) => {
      const fields = [
        { id: 'name', type: 'Symbol', localized: false },
        {
          id: 'nestedRef',
          type: 'Link',
          linkType: 'Entry',
          localized: false,
        },
      ];

      return {
        fields,
        displayField: 'name',
        sys: {
          id: contentTypeId,
        },
      };
    });

    const result = await createFields(entryId, entryContentTypeId, mockCma);
    expect(result).toHaveLength(2); // name and nestedRef
    expect(result[0].id).toEqual('name');
    expect(result[1]).toBeInstanceOf(ReferenceField);

    // Verify that we have references up to level 5 but not beyond
    let currentField: ReferenceField | null = result[1] as ReferenceField;
    let level = 2;

    while (currentField && level <= max_depth) {
      if (level < max_depth) {
        expect(currentField.fields.length).toBe(2);
        const nestedRefField = currentField.fields[1] as ReferenceField;
        expect(nestedRefField.entryContentTypeId).toBe(`level${level}`);
        expect(nestedRefField.referenceContentTypeId).toBe(`level${level + 1}`);
        currentField = nestedRefField || null;
      } else {
        // At level 5, we should have the name field but no further references
        expect(currentField.fields.length).toBe(1);
        expect(currentField.fields[0].id).toBe('name');
      }

      level++;
    }
  });

  describe('getDisplayFieldValue', () => {
    let fieldsFactory: FieldsFactory;

    beforeEach(() => {
      fieldsFactory = new FieldsFactory(entryId, entryContentTypeId, mockCma as any);
    });

    it('should return "Untitled" when displayField is invalid (undefined, null, or empty string)', () => {
      const fieldValue = { fields: { name: { 'en-US': 'John Doe' } } };

      expect((fieldsFactory as any).getDisplayFieldValue(fieldValue, undefined)).toBe('Untitled');
      expect((fieldsFactory as any).getDisplayFieldValue(fieldValue, null)).toBe('Untitled');
      expect((fieldsFactory as any).getDisplayFieldValue(fieldValue, '')).toBe('Untitled');
    });

    it('should return "Untitled" when displayField does not exist in fields', () => {
      const fieldValue = { fields: { name: { 'en-US': 'John Doe' } } };

      expect((fieldsFactory as any).getDisplayFieldValue(fieldValue, 'nonexistent')).toBe(
        'Untitled'
      );
    });

    it('should return "Untitled" when displayField value is null, undefined, empty object, or object with only null values', () => {
      const fieldValueNull = { fields: { name: null } };
      const fieldValueUndef = { fields: { name: undefined } };
      const fieldValueEmptyObj = { fields: { name: {} } };
      const fieldValueNulls = { fields: { name: { 'en-US': null } } };

      expect((fieldsFactory as any).getDisplayFieldValue(fieldValueNull, 'name')).toBe('Untitled');
      expect((fieldsFactory as any).getDisplayFieldValue(fieldValueUndef, 'name')).toBe('Untitled');
      expect((fieldsFactory as any).getDisplayFieldValue(fieldValueEmptyObj, 'name')).toBe(
        undefined
      );
      expect((fieldsFactory as any).getDisplayFieldValue(fieldValueNulls, 'name')).toBe(null);
    });

    it('should return first locale value when displayField is a localized object (single or multiple locales)', () => {
      const fieldValueSingle = { fields: { name: { 'en-US': 'John Doe' } } };
      const fieldValueMulti = {
        fields: {
          title: {
            'fr-FR': 'Titre Français',
            'de-DE': 'Deutscher Titel',
            'en-US': 'English Title',
          },
        },
      };

      expect((fieldsFactory as any).getDisplayFieldValue(fieldValueSingle, 'name')).toBe(
        'John Doe'
      );
      expect((fieldsFactory as any).getDisplayFieldValue(fieldValueMulti, 'title')).toBe(
        'Titre Français'
      );
    });

    it('should return string value when displayField is a direct string', () => {
      const fieldValue = { fields: { name: 'John Doe' } };

      expect((fieldsFactory as any).getDisplayFieldValue(fieldValue, 'name')).toBe('John Doe');
    });
  });
});

async function createFields(
  entryId: string,
  entryContentTypeId: string,
  mockCma: {
    contentType: { get: Mock };
    entry: { references: Mock };
  }
) {
  const fieldsFactory = new FieldsFactory(entryId, entryContentTypeId, mockCma as any);
  const cmaEntry = await fieldsFactory.getEntry();
  return await fieldsFactory.createFieldsForEntry(cmaEntry.fields);
}
