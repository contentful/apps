import { describe, it, expect } from 'vitest';
import {
  flattenEntry,
  flattenEntries,
  getColumnHeaders,
  type Entry,
  type ContentType,
} from '../flatten';

describe('flatten', () => {
  const mockContentType: ContentType = {
    sys: { id: 'blogPost' },
    name: 'Blog Post',
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol', localized: true },
      { id: 'slug', name: 'Slug', type: 'Symbol', localized: false },
      { id: 'body', name: 'Body', type: 'Text', localized: true },
      { id: 'author', name: 'Author', type: 'Link', localized: false, linkType: 'Entry' },
      { id: 'tags', name: 'Tags', type: 'Array', localized: false, items: { type: 'Symbol' } },
      {
        id: 'relatedPosts',
        name: 'Related',
        type: 'Array',
        localized: false,
        items: { type: 'Link', linkType: 'Entry' },
      },
      { id: 'metadata', name: 'Metadata', type: 'Object', localized: false },
      { id: 'publishDate', name: 'Publish Date', type: 'Date', localized: false },
      { id: 'featured', name: 'Featured', type: 'Boolean', localized: false },
    ],
  };

  const mockEntry: Entry = {
    sys: {
      id: 'entry123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      publishedVersion: 5,
      contentType: { sys: { id: 'blogPost' } },
      updatedBy: { sys: { id: 'user123' } },
    },
    fields: {
      title: {
        'en-US': 'Hello World',
        'de-DE': 'Hallo Welt',
      },
      slug: {
        'en-US': 'hello-world',
      },
      body: {
        'en-US': 'This is the body',
        'de-DE': 'Das ist der Körper',
      },
      author: {
        'en-US': {
          sys: {
            type: 'Link',
            linkType: 'Entry',
            id: 'author123',
          },
        },
      },
      tags: {
        'en-US': ['tech', 'blog'],
      },
      relatedPosts: {
        'en-US': [
          { sys: { type: 'Link', linkType: 'Entry', id: 'post1' } },
          { sys: { type: 'Link', linkType: 'Entry', id: 'post2' } },
        ],
      },
      metadata: {
        'en-US': { seo: { description: 'test' } },
      },
      publishDate: {
        'en-US': '2024-01-15',
      },
      featured: {
        'en-US': true,
      },
    },
  };

  describe('flattenEntry', () => {
    it('should flatten entry with localized fields', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US', 'de-DE'],
        userMap: { user123: 'John Doe' },
      });

      expect(result['Entry ID']).toBe('entry123');
      expect(result['Created']).toBe('2024-01-01');
      expect(result['Updated']).toBe('2024-01-02');
      expect(result['Last Updated By']).toBe('John Doe');
      expect(result['Status']).toBe('Published');
      expect(result['Content Type']).toBe('Blog Post');
      expect(result['Title (en-US)']).toBe('Hello World');
      expect(result['Title (de-DE)']).toBe('Hallo Welt');
      expect(result['Body (en-US)']).toBe('This is the body');
      expect(result['Body (de-DE)']).toBe('Das ist der Körper');
    });

    it('should flatten non-localized fields', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
      });

      expect(result['Slug']).toBe('hello-world');
      expect(result['Featured']).toBe(true);
      expect(result['Publish Date']).toBe('2024-01-15');
    });

    it('should format link fields', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
      });

      expect(result['Author']).toBe('author123');
    });

    it('should format array of links', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
      });

      expect(result['Related']).toBe('post1; post2');
    });

    it('should format simple arrays with semicolons', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
      });

      expect(result['Tags']).toBe('tech; blog');
    });

    it('should JSON stringify objects', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
      });

      expect(result['Metadata']).toBe('{"seo":{"description":"test"}}');
    });

    it('should handle missing fields', () => {
      const entryWithMissingFields: Entry = {
        sys: mockEntry.sys,
        fields: {
          title: { 'en-US': 'Only Title' },
        },
      };

      const result = flattenEntry(entryWithMissingFields, {
        contentType: mockContentType,
        locales: ['en-US', 'de-DE'],
      });

      expect(result['Title (en-US)']).toBe('Only Title');
      expect(result['Title (de-DE)']).toBeNull();
      expect(result['Slug']).toBeNull();
      expect(result['Body (en-US)']).toBeNull();
    });

    it('should respect the order of fields in the fields option', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
        fields: ['slug', 'title', 'body'],
      });

      const orderedKeys = Object.keys(result);
      const slugIdx = orderedKeys.indexOf('Slug');
      const titleIdx = orderedKeys.indexOf('Title (en-US)');
      const bodyIdx = orderedKeys.indexOf('Body (en-US)');

      expect(slugIdx).toBeGreaterThan(-1);
      expect(titleIdx).toBeGreaterThan(slugIdx);
      expect(bodyIdx).toBeGreaterThan(titleIdx);
    });

    it('should ignore unknown field IDs in the fields option', () => {
      const result = flattenEntry(mockEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
        fields: ['title', 'doesNotExist', 'slug'],
      });

      expect(result['Title (en-US)']).toBe('Hello World');
      expect(result['Slug']).toBe('hello-world');
      expect(result['doesNotExist']).toBeUndefined();
    });

    it('should handle unpublished entries', () => {
      const unpublishedEntry: Entry = {
        ...mockEntry,
        sys: {
          ...mockEntry.sys,
          publishedVersion: undefined,
          updatedBy: undefined,
        },
      };

      const result = flattenEntry(unpublishedEntry, {
        contentType: mockContentType,
        locales: ['en-US'],
      });

      expect(result['Status']).toBe('Draft');
      expect(result['Last Updated By']).toBe('Unknown');
    });
  });

  describe('flattenEntries', () => {
    it('should flatten multiple entries', () => {
      const entries = [mockEntry, mockEntry];
      const results = flattenEntries(entries, {
        contentType: mockContentType,
        locales: ['en-US'],
      });

      expect(results).toHaveLength(2);
      expect(results[0]['Entry ID']).toBe('entry123');
      expect(results[1]['Entry ID']).toBe('entry123');
    });
  });

  describe('getColumnHeaders', () => {
    it('should generate correct headers', () => {
      const headers = getColumnHeaders(mockContentType, ['en-US', 'de-DE']);

      expect(headers).toContain('Entry ID');
      expect(headers).toContain('Created');
      expect(headers).toContain('Updated');
      expect(headers).toContain('Last Updated By');
      expect(headers).toContain('Status');
      expect(headers).toContain('Content Type');
      expect(headers).toContain('Title (en-US)');
      expect(headers).toContain('Title (de-DE)');
      expect(headers).toContain('Body (en-US)');
      expect(headers).toContain('Body (de-DE)');
      expect(headers).toContain('Slug');
      expect(headers).toContain('Author');
      expect(headers).toContain('Tags');
    });
  });
});
