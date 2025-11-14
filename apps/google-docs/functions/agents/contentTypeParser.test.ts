/**
 * Tests for Content Type Parser Agent
 */

import { describe, it, expect } from 'vitest';
import { generateTextSummary, parseContentTypes } from './contentTypeParser.agent';
import type { ParseResult } from './contentTypeParser.agent';
import type { ContentTypeProps } from 'contentful-management';

const contentTypes: ContentTypeProps[] = [
  {
    name: 'Blog page',
    description: 'Blog page with title, body, image and other recommended posts',
    displayField: 'title',
    fields: [
      {
        id: 'title',
        name: 'Title',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
      },
      {
        id: 'body',
        name: 'Body',
        type: 'RichText',
        localized: false,
        required: false,
        validations: [
          {
            enabledNodeTypes: [
              'heading-1',
              'heading-2',
              'heading-3',
              'heading-4',
              'heading-5',
              'heading-6',
              'ordered-list',
              'unordered-list',
              'hr',
              'blockquote',
              'embedded-entry-block',
              'embedded-asset-block',
              'hyperlink',
              'entry-hyperlink',
              'asset-hyperlink',
              'embedded-entry-inline',
            ],
            message:
              'Only heading 1, heading 2, heading 3, heading 4, heading 5, heading 6, ordered list, unordered list, horizontal rule, quote, block entry, asset, link to Url, link to entry, link to asset, and inline entry nodes are allowed',
          },
          {
            enabledMarks: ['bold', 'italic', 'underline', 'code'],
            message: 'Only bold, italic, underline, and code marks are allowed',
          },
        ],
        disabled: false,
        omitted: false,
      },
      {
        id: 'image',
        name: 'Image',
        type: 'Link',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        linkType: 'Asset',
      },
      {
        id: 'recommendedPosts',
        name: 'Recommended posts',
        type: 'Array',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
        items: {
          type: 'Link',
          validations: [
            {
              linkContentType: ['blogPage'],
            },
          ],
          linkType: 'Entry',
        },
      },
      {
        id: 'description',
        name: 'description',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
      },
      {
        id: 'readTime',
        name: 'read time',
        type: 'Integer',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
      },
    ],
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: '0nry99bqfrnk',
        },
      },
      id: 'blogPage',
      type: 'ContentType',
      createdAt: '2025-11-06T21:48:44.253Z',
      updatedAt: '2025-11-06T22:11:53.251Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      publishedVersion: 9,
      firstPublishedAt: '2025-11-06T21:48:44.692Z',
      createdBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '6jVzPJ7gBtXunT5lYWOhKy',
        },
      },
      updatedBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '6jVzPJ7gBtXunT5lYWOhKy',
        },
      },
      publishedCounter: 5,
      version: 10,
    },
  },
  {
    name: 'article',
    description: '',
    displayField: 'body',
    fields: [
      {
        id: 'body',
        name: 'body',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
      },
      {
        id: 'title',
        name: 'title',
        type: 'Symbol',
        localized: false,
        required: false,
        validations: [],
        disabled: false,
        omitted: false,
      },
    ],
    sys: {
      space: {
        sys: {
          type: 'Link',
          linkType: 'Space',
          id: '0nry99bqfrnk',
        },
      },
      id: 'article',
      type: 'ContentType',
      createdAt: '2025-10-14T21:38:59.878Z',
      updatedAt: '2025-11-06T20:14:21.321Z',
      environment: {
        sys: {
          id: 'master',
          type: 'Link',
          linkType: 'Environment',
        },
      },
      publishedVersion: 5,
      firstPublishedAt: '2025-10-14T21:39:00.148Z',
      createdBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '6jVzPJ7gBtXunT5lYWOhKy',
        },
      },
      updatedBy: {
        sys: {
          type: 'Link',
          linkType: 'User',
          id: '6jVzPJ7gBtXunT5lYWOhKy',
        },
      },
      publishedCounter: 3,
      version: 6,
    },
  },
];

describe('Content Type Parser Agent', () => {
  describe('parseContentTypes', () => {
    it('should parse real Contentful content types and return structured summaries', async () => {
      // This test calls the actual OpenAI API
      // Skip in CI or when OPENAI_API_KEY is not available
      if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  Skipping integration test - OPENAI_API_KEY not set');
        return;
      }

      const result = await parseContentTypes(contentTypes, {
        modelVersion: 'gpt-4o-mini', // Use mini for faster/cheaper testing
        temperature: 0.3,
      });

      // Verify the structure of the result
      expect(result).toBeDefined();
      expect(result.contentTypes).toBeInstanceOf(Array);
      expect(result.contentTypes.length).toBe(2);
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
      expect(result.complexity).toBeDefined();
      expect(['simple', 'moderate', 'complex'].includes(result.complexity)).toBe(true);

      // Verify first content type (Blog page)
      const blogPage = result.contentTypes.find((ct) => ct.id === 'blogPage');
      expect(blogPage).toBeDefined();
      expect(blogPage!.name).toBe('Blog page');
      expect(blogPage!.description).toBeDefined();
      expect(blogPage!.purpose).toBeDefined();
      expect(blogPage!.fieldCount).toBe(6); // title, body, image, recommendedPosts, description, readTime
      expect(blogPage!.keyFields).toBeInstanceOf(Array);
      expect(blogPage!.keyFields.length).toBeGreaterThan(0);
      expect(blogPage!.recommendations).toBeInstanceOf(Array);

      // Verify second content type (article)
      const article = result.contentTypes.find((ct) => ct.id === 'article');
      expect(article).toBeDefined();
      expect(article!.name).toBe('article');
      expect(article!.fieldCount).toBe(2); // body, title
      expect(article!.keyFields).toBeInstanceOf(Array);

      // Log the result for manual inspection
      console.log('\n📊 Parse Result:');
      console.log(JSON.stringify(result, null, 2));
    }, 30000); // 30 second timeout for API call

    it('should handle content types with complex field validations', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  Skipping integration test - OPENAI_API_KEY not set');
        return;
      }

      // Use just the Blog page which has RichText with validations
      const blogPageOnly = [contentTypes[0]];

      const result = await parseContentTypes(blogPageOnly, {
        modelVersion: 'gpt-4o-mini',
        temperature: 0.3,
      });

      expect(result.contentTypes.length).toBe(1);
      const blogPage = result.contentTypes[0];

      // Should recognize the RichText field
      expect(blogPage.keyFields.some((f) => f.toLowerCase().includes('body'))).toBe(true);

      // Should have meaningful recommendations
      expect(blogPage.recommendations.length).toBeGreaterThan(0);
      expect(blogPage.recommendations.some((r) => r.length > 10)).toBe(true);

      console.log('\n📝 Blog Page Summary:');
      console.log(`Description: ${blogPage.description}`);
      console.log(`Purpose: ${blogPage.purpose}`);
      console.log(`Key Fields: ${blogPage.keyFields.join(', ')}`);
      console.log(`Recommendations:`);
      blogPage.recommendations.forEach((r) => console.log(`  - ${r}`));
    }, 30000);

    it('should generate a readable text summary from parsed content types', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  Skipping integration test - OPENAI_API_KEY not set');
        return;
      }

      const result = await parseContentTypes(contentTypes, {
        modelVersion: 'gpt-4o-mini',
        temperature: 0.3,
      });
      console.log(result);
    }, 30000);
  });

  describe('generateTextSummary', () => {
    it('should generate a text summary from parse result', () => {
      // Mock parse result with simplified schema
      const mockParseResult: ParseResult = {
        contentTypes: [
          {
            id: 'blogPost',
            name: 'Blog Post',
            description: 'A blog post content type',
            purpose: 'To store blog post content',
            fieldCount: 5,
            keyFields: ['title', 'body', 'author'],
            recommendations: [
              'Always provide a descriptive title',
              'Use rich text for proper formatting',
            ],
          },
          {
            id: 'author',
            name: 'Author',
            description: 'An author content type',
            purpose: 'To store author information',
            fieldCount: 3,
            keyFields: ['name', 'bio'],
            recommendations: ['Keep author profiles up to date'],
          },
        ],
        summary:
          'This content model contains blog posts and author information with a clear relationship structure.',
        complexity: 'simple',
      };

      const textSummary = generateTextSummary(mockParseResult);

      // Verify summary contains expected sections
      expect(textSummary).toContain('Content Model Summary');
      expect(textSummary).toContain('Blog Post');
      expect(textSummary).toContain('Author');
      expect(textSummary).toContain('Complexity: simple');
      expect(textSummary).toContain('Total Content Types: 2');
    });

    it('should handle empty key fields', () => {
      const mockParseResult: ParseResult = {
        contentTypes: [
          {
            id: 'simpleType',
            name: 'Simple Type',
            description: 'A simple content type',
            purpose: 'For testing',
            fieldCount: 1,
            keyFields: [],
            recommendations: [],
          },
        ],
        summary: 'Test summary',
        complexity: 'simple',
      };

      const textSummary = generateTextSummary(mockParseResult);

      expect(textSummary).toContain('Simple Type');
      expect(textSummary).not.toContain('Key Fields:');
    });

    it('should display recommendations when available', () => {
      const mockParseResult: ParseResult = {
        contentTypes: [
          {
            id: 'testType',
            name: 'Test Type',
            description: 'Test',
            purpose: 'Testing',
            fieldCount: 5,
            keyFields: ['title'],
            recommendations: ['Add more fields', 'Consider localization'],
          },
        ],
        summary: 'Test',
        complexity: 'simple',
      };

      const textSummary = generateTextSummary(mockParseResult);

      expect(textSummary).toContain('Recommendations:');
      expect(textSummary).toContain('- Add more fields');
      expect(textSummary).toContain('- Consider localization');
    });
  });

  describe('Type Exports', () => {
    it('should export expected types', () => {
      // This is a compile-time check
      // If types are not exported, TypeScript will fail to compile
      const config: import('./contentTypeParser.agent').ContentTypeParserConfig = {
        modelVersion: 'gpt-4o',
        temperature: 0.5,
      };

      expect(config.modelVersion).toBe('gpt-4o');
      expect(config.temperature).toBe(0.5);
    });
  });
});
