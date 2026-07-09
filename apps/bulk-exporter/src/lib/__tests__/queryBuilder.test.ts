import { describe, it, expect } from 'vitest';
import { buildQuery, type QueryFormData } from '../queryBuilder';

describe('queryBuilder', () => {
  describe('basic content type', () => {
    it('should include content_type', () => {
      const data: QueryFormData = { contentTypeId: 'blogPost' };
      const result = buildQuery(data);
      expect(result).toEqual({ content_type: 'blogPost' });
    });
  });

  describe('full-text search', () => {
    it('should add query parameter when search is provided', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        search: 'hello world',
      };
      const result = buildQuery(data);
      expect(result.query).toBe('hello world');
    });

    it('should trim search string', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        search: '  hello  ',
      };
      const result = buildQuery(data);
      expect(result.query).toBe('hello');
    });

    it('should not add query parameter for empty search', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        search: '   ',
      };
      const result = buildQuery(data);
      expect(result.query).toBeUndefined();
    });
  });

  describe('status filters', () => {
    it('should filter for published entries', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        status: 'published',
      };
      const result = buildQuery(data);
      expect(result['sys.publishedAt[exists]']).toBe(true);
      expect(result['sys.archivedAt[exists]']).toBe(false);
    });

    it('should filter for draft entries', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        status: 'draft',
      };
      const result = buildQuery(data);
      expect(result['sys.publishedAt[exists]']).toBe(false);
      expect(result['sys.archivedAt[exists]']).toBe(false);
    });

    it('should filter for changed entries', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        status: 'changed',
      };
      const result = buildQuery(data);
      expect(result['sys.publishedAt[exists]']).toBe(true);
      expect(result['sys.archivedAt[exists]']).toBe(false);
      expect(result['sys.publishedVersion[ne]']).toBe('sys.version');
    });

    it('should filter for archived entries', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        status: 'archived',
      };
      const result = buildQuery(data);
      expect(result['sys.archivedAt[exists]']).toBe(true);
    });

    it('should not add filters for any status', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        status: 'any',
      };
      const result = buildQuery(data);
      expect(result['sys.publishedAt[exists]']).toBeUndefined();
    });
  });

  describe('date ranges', () => {
    it('should add created date range', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        createdFrom: '2024-01-01',
        createdTo: '2024-12-31',
      };
      const result = buildQuery(data);
      expect(result['sys.createdAt[gte]']).toBe('2024-01-01');
      expect(result['sys.createdAt[lte]']).toBe('2024-12-31');
    });

    it('should add updated date range', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        updatedFrom: '2024-06-01',
        updatedTo: '2024-06-30',
      };
      const result = buildQuery(data);
      expect(result['sys.updatedAt[gte]']).toBe('2024-06-01');
      expect(result['sys.updatedAt[lte]']).toBe('2024-06-30');
    });

    it('should handle partial date ranges', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        createdFrom: '2024-01-01',
      };
      const result = buildQuery(data);
      expect(result['sys.createdAt[gte]']).toBe('2024-01-01');
      expect(result['sys.createdAt[lte]']).toBeUndefined();
    });
  });

  describe('sort order', () => {
    it('should add sort parameter', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        sort: '-sys.createdAt',
      };
      const result = buildQuery(data);
      expect(result.order).toBe('-sys.createdAt');
    });
  });

  describe('tags', () => {
    it('should add tags with match any (in)', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        tags: ['tag1', 'tag2', 'tag3'],
        tagsMatchAll: false,
      };
      const result = buildQuery(data);
      expect(result['metadata.tags.sys.id[in]']).toBe('tag1,tag2,tag3');
    });

    it('should add tags with match all', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        tags: ['tag1', 'tag2'],
        tagsMatchAll: true,
      };
      const result = buildQuery(data);
      expect(result['metadata.tags.sys.id[all]']).toBe('tag1,tag2');
    });

    it('should not add tags parameter if array is empty', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        tags: [],
      };
      const result = buildQuery(data);
      expect(result['metadata.tags.sys.id[in]']).toBeUndefined();
      expect(result['metadata.tags.sys.id[all]']).toBeUndefined();
    });
  });

  describe('concepts', () => {
    it('should add concepts with match any (in)', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        concepts: ['concept1', 'concept2'],
        conceptsMatchAll: false,
      };
      const result = buildQuery(data);
      expect(result['metadata.concepts.sys.id[in]']).toBe('concept1,concept2');
    });

    it('should add concepts with match all', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        concepts: ['concept1', 'concept2'],
        conceptsMatchAll: true,
      };
      const result = buildQuery(data);
      expect(result['metadata.concepts.sys.id[all]']).toBe('concept1,concept2');
    });
  });

  describe('field filters', () => {
    it('should add equals filter', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        fieldFilters: [
          { fieldId: 'title', operator: 'equals', value: 'Hello' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.title']).toBe('Hello');
    });

    it('should add not equals filter', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        fieldFilters: [
          { fieldId: 'status', operator: 'not_equals', value: 'draft' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.status[ne]']).toBe('draft');
    });

    it('should add contains filter', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        fieldFilters: [
          { fieldId: 'body', operator: 'contains', value: 'keyword' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.body[match]']).toBe('keyword');
    });

    it('should add comparison filters', () => {
      const data: QueryFormData = {
        contentTypeId: 'product',
        fieldFilters: [
          { fieldId: 'price', operator: 'gte', value: '100' },
          { fieldId: 'stock', operator: 'lt', value: '10' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.price[gte]']).toBe('100');
      expect(result['fields.stock[lt]']).toBe('10');
    });

    it('should add exists filter', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        fieldFilters: [
          { fieldId: 'featuredImage', operator: 'exists', value: 'true' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.featuredImage[exists]']).toBe(true);
    });

    it('should add boolean filters', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        fieldFilters: [
          { fieldId: 'published', operator: 'is_true', value: '' },
          { fieldId: 'archived', operator: 'is_false', value: '' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.published']).toBe(true);
      expect(result['fields.archived']).toBe(false);
    });

    it('should add links_to filter', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        fieldFilters: [
          { fieldId: 'author', operator: 'links_to', value: 'author123' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.author.sys.id']).toBe('author123');
    });

    it('should handle multiple field filters', () => {
      const data: QueryFormData = {
        contentTypeId: 'product',
        fieldFilters: [
          { fieldId: 'category', operator: 'equals', value: 'electronics' },
          { fieldId: 'price', operator: 'gte', value: '100' },
          { fieldId: 'inStock', operator: 'is_true', value: '' },
        ],
      };
      const result = buildQuery(data);
      expect(result['fields.category']).toBe('electronics');
      expect(result['fields.price[gte]']).toBe('100');
      expect(result['fields.inStock']).toBe(true);
    });

    it('should skip filters with missing fieldId or operator', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        fieldFilters: [
          { fieldId: '', operator: 'equals', value: 'test' },
          { fieldId: 'title', operator: '' as any, value: 'test' },
        ],
      };
      const result = buildQuery(data);
      expect(Object.keys(result)).toHaveLength(1); // only content_type
    });
  });

  describe('combined filters', () => {
    it('should combine multiple filter types', () => {
      const data: QueryFormData = {
        contentTypeId: 'blogPost',
        search: 'react',
        status: 'published',
        tags: ['tech', 'tutorial'],
        tagsMatchAll: false,
        createdFrom: '2024-01-01',
        sort: '-sys.createdAt',
        fieldFilters: [
          { fieldId: 'category', operator: 'equals', value: 'programming' },
        ],
      };
      const result = buildQuery(data);
      
      expect(result.content_type).toBe('blogPost');
      expect(result.query).toBe('react');
      expect(result['sys.publishedAt[exists]']).toBe(true);
      expect(result['metadata.tags.sys.id[in]']).toBe('tech,tutorial');
      expect(result['sys.createdAt[gte]']).toBe('2024-01-01');
      expect(result.order).toBe('-sys.createdAt');
      expect(result['fields.category']).toBe('programming');
    });
  });
});
