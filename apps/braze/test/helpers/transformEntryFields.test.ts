import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformEntryFields } from '../../src/helpers/transformEntryFields';
import { BasicField } from '../../src/fields/BasicField';
import { AssetField } from '../../src/fields/AssetField';
import { ReferenceField } from '../../src/fields/ReferenceField';
import { BasicArrayField } from '../../src/fields/BasicArrayField';
import { AssetArrayField } from '../../src/fields/AssetArrayField';
import { ReferenceArrayField } from '../../src/fields/ReferenceArrayField';
import { ReferenceItem } from '../../src/fields/ReferenceItem';

describe('transformEntryFields', () => {
  const mockCma = {
    contentType: {
      get: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a BasicField instance with correct properties', async () => {
    const mockEntry = {
      sys: {
        contentType: {
          sys: { id: 'article' },
        },
      },
      fields: {
        title: { 'en-US': 'Test Article Title' },
      },
    };

    mockCma.contentType.get.mockResolvedValue({
      name: 'Article',
      fields: [{ id: 'title', type: 'Symbol', localized: true }],
    });

    const result = await transformEntryFields(mockEntry, mockCma as any);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(BasicField);
    const fieldInstance = result[0] as BasicField;
    expect(fieldInstance.id).toBe('title');
    expect(fieldInstance.entryContentTypeId).toBe('Article');
    expect(fieldInstance.localized).toBe(true);
    expect(fieldInstance.type).toBe('Symbol');
  });

  it('should create an AssetField instance with correct properties', async () => {
    const mockEntry = {
      sys: {
        contentType: {
          sys: { id: 'article' },
        },
      },
      fields: {
        featuredImage: {
          'en-US': {
            sys: { type: 'Link', linkType: 'Asset' },
          },
        },
      },
    };

    mockCma.contentType.get.mockResolvedValue({
      name: 'Article',
      fields: [{ id: 'featuredImage', type: 'Link', linkType: 'Asset', localized: true }],
    });

    const result = await transformEntryFields(mockEntry, mockCma as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(AssetField);
    const fieldInstance = result[0] as AssetField;
    expect(fieldInstance.id).toBe('featuredImage');
    expect(fieldInstance.entryContentTypeId).toBe('Article');
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

    const mockEntry = {
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
    };

    mockCma.contentType.get.mockImplementation(({ contentTypeId }) => {
      if (contentTypeId === 'article') {
        return {
          name: 'Article',
          fields: [{ id: 'author', type: 'Link', linkType: 'Entry', localized: false }],
        };
      } else if (contentTypeId === 'author') {
        return {
          name: 'Author',
          fields: [
            { id: 'name', type: 'Symbol', localized: true },
            { id: 'bio', type: 'Text', localized: true },
          ],
        };
      }
    });

    const result = await transformEntryFields(mockEntry, mockCma as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ReferenceField);
    const fieldInstance = result[0] as ReferenceField;
    expect(fieldInstance.id).toBe('author');
    expect(fieldInstance.entryContentTypeId).toBe('Article');
    expect(fieldInstance.localized).toBe(false);
    expect(fieldInstance.referenceContentType).toBe('author');

    expect(fieldInstance.fields).toHaveLength(2);
    expect(fieldInstance.fields[0]).toBeInstanceOf(BasicField);
    expect(fieldInstance.fields[0].id).toBe('name');
    expect(fieldInstance.fields[1]).toBeInstanceOf(BasicField);
    expect(fieldInstance.fields[1].id).toBe('bio');
  });

  it('should create a BasicArrayField instance with correct properties', async () => {
    const mockEntry = {
      sys: {
        contentType: {
          sys: { id: 'article' },
        },
      },
      fields: {
        tags: { 'en-US': ['news', 'tech', 'featured'] },
      },
    };

    mockCma.contentType.get.mockResolvedValue({
      name: 'Article',
      fields: [{ id: 'tags', type: 'Array', items: { type: 'Symbol' }, localized: true }],
    });

    const result = await transformEntryFields(mockEntry, mockCma as any);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(BasicArrayField);
    const fieldInstance = result[0] as BasicArrayField;
    expect(fieldInstance.id).toBe('tags');
    expect(fieldInstance.entryContentTypeId).toBe('Article');
    expect(fieldInstance.localized).toBe(true);
  });

  it('should create an AssetArrayField instance with correct properties', async () => {
    const mockEntry = {
      sys: {
        contentType: {
          sys: { id: 'gallery' },
        },
      },
      fields: {
        images: {
          'en-US': [
            { sys: { type: 'Link', linkType: 'Asset' } },
            { sys: { type: 'Link', linkType: 'Asset' } },
          ],
        },
      },
    };

    mockCma.contentType.get.mockResolvedValue({
      name: 'Gallery',
      fields: [
        {
          id: 'images',
          type: 'Array',
          items: { type: 'Link', linkType: 'Asset' },
          localized: true,
        },
      ],
    });

    const result = await transformEntryFields(mockEntry, mockCma as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(AssetArrayField);
    const fieldInstance = result[0] as AssetArrayField;
    expect(fieldInstance.id).toBe('images');
    expect(fieldInstance.entryContentTypeId).toBe('Gallery');
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

    const mockEntry = {
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
    };

    mockCma.contentType.get.mockImplementation(({ contentTypeId }) => {
      if (contentTypeId === 'article') {
        return {
          name: 'Article',
          fields: [
            {
              id: 'categories',
              type: 'Array',
              items: { type: 'Link', linkType: 'Entry' },
              localized: false,
            },
          ],
        };
      } else if (contentTypeId === 'category') {
        return {
          name: 'Category',
          fields: [{ id: 'name', type: 'Symbol', localized: true }],
        };
      }
    });

    const result = await transformEntryFields(mockEntry, mockCma as any);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ReferenceArrayField);
    const fieldInstance = result[0] as ReferenceArrayField;

    expect(fieldInstance.id).toBe('categories');
    expect(fieldInstance.entryContentTypeId).toBe('Article');
    expect(fieldInstance.localized).toBe(false);

    expect(fieldInstance.items).toHaveLength(2);
    expect(fieldInstance.items[0]).toBeInstanceOf(ReferenceItem);
    expect(fieldInstance.items[0].referenceContentType).toBe('category');
    expect(fieldInstance.items[0].fields).toHaveLength(1);
    expect(fieldInstance.items[0].fields[0].id).toBe('name');

    expect(fieldInstance.items[1]).toBeInstanceOf(ReferenceItem);
    expect(fieldInstance.items[1].referenceContentType).toBe('category');
    expect(fieldInstance.items[1].fields).toHaveLength(1);
    expect(fieldInstance.items[1].fields[0].id).toBe('name');
  });

  it('should throw an error when field is not found in content type', async () => {
    const mockEntry = {
      sys: {
        contentType: {
          sys: { id: 'article' },
        },
      },
      fields: {
        nonExistentField: { 'en-US': 'Some value' },
      },
    };

    mockCma.contentType.get.mockResolvedValue({
      name: 'Article',
      fields: [{ id: 'title', type: 'Symbol', localized: true }],
    });

    await expect(transformEntryFields(mockEntry, mockCma as any)).rejects.toThrow(
      'Field not found'
    );
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

    mockCma.contentType.get.mockImplementation(({ contentTypeId }) => {
      const level = parseInt(contentTypeId.replace('level', ''));
      const fields = [
        { id: 'name', type: 'Symbol', localized: false },
        {
          id: 'nestedRef',
          type: 'Link',
          localized: false,
        },
      ];

      return {
        name: `level${level}`,
        fields,
      };
    });

    const result = await transformEntryFields(mockEntry, mockCma as any);

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
        expect(nestedRefField.referenceContentType).toBe(`level${level + 1}`);
        currentField = nestedRefField || null;
      } else {
        // At level 5, we should have the name field but no further references
        expect(currentField.fields.length).toBe(1);
        expect(currentField.fields[0].id).toBe('name');
      }

      level++;
    }
  });
});
