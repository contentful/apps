/**
 * Tests for Content Type Parser Agent
 */

import { describe, it, expect } from 'vitest';
import { analyzeContentTypes } from './contentTypeParser.agent';
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
      if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  Skipping integration test - OPENAI_API_KEY not set');
        return;
      }

      // Calling the Content Type Parser Agent
      const result = await analyzeContentTypes({
        contentTypes,
        openAiApiKey: process.env.OPENAI_API_KEY,
      });

      // Verify the structure of the result
      expect(result).toBeDefined();
      expect(result.contentTypes).toBeInstanceOf(Array);
      expect(result.contentTypes.length).toBe(2);
      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
      expect(result.complexity).toBeDefined();
      expect(['simple', 'moderate', 'complex'].includes(result.complexity)).toBe(true);

      // Verify first content types
      const blogPage = result.contentTypes.find((ct) => ct.id === 'blogPage');
      expect(blogPage).toBeDefined();
      expect(blogPage!.name).toBe('Blog page');
      expect(blogPage!.description).toBeDefined();
      expect(blogPage!.purpose).toBeDefined();
      expect(blogPage!.keyFields).toBeInstanceOf(Array);
      expect(blogPage!.keyFields.length).toBeGreaterThan(0);
      expect(blogPage!.recommendations).toBeInstanceOf(Array);

      const article = result.contentTypes.find((ct) => ct.id === 'article');
      expect(article).toBeDefined();
      expect(article!.name).toBe('article');
      expect(article!.keyFields).toBeInstanceOf(Array);

      console.log('\n📊 Parse Result:');
      console.log(JSON.stringify(result, null, 2));
    }, 30000);
  });
});
