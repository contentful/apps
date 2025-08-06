import { describe, expect, it } from 'vitest';
import {
  getRichTextFields,
  processContentTypesToFields,
  restoreSelectedFields,
} from '../src/utils';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeField } from '@contentful/app-sdk';

describe('utils', () => {
  describe('getRichTextFields', () => {
    it('should return empty array when no fields are provided', () => {
      const result = getRichTextFields({});
      expect(result).toEqual([]);
    });

    it('should return empty array when no rich text fields exist', () => {
      const contentType = {
        fields: [
          { id: 'title', name: 'Title', type: 'Text', required: false, localized: false },
          { id: 'author', name: 'Author', type: 'Text', required: false, localized: false },
        ] as ContentTypeField[],
      };
      const result = getRichTextFields(contentType);
      expect(result).toEqual([]);
    });

    it('should return only rich text fields', () => {
      const contentType = {
        fields: [
          { id: 'title', name: 'Title', type: 'Text', required: false, localized: false },
          { id: 'content', name: 'Content', type: 'RichText', required: false, localized: false },
          { id: 'author', name: 'Author', type: 'Text', required: false, localized: false },
          { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false },
        ] as ContentTypeField[],
      };
      const result = getRichTextFields(contentType);
      expect(result).toEqual([
        { id: 'content', name: 'Content', type: 'RichText' },
        { id: 'body', name: 'Body', type: 'RichText' },
      ]);
    });
  });

  describe('processContentTypesToFields', () => {
    it('should return empty array when no content types are provided', () => {
      const result = processContentTypesToFields([]);
      expect(result).toEqual([]);
    });

    it('should filter out content types without rich text fields', () => {
      const contentTypes: ContentTypeProps[] = [
        {
          sys: { id: 'blog-post' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Text', required: false, localized: false },
          ] as ContentTypeField[],
        } as ContentTypeProps,
      ];
      const result = processContentTypesToFields(contentTypes);
      expect(result).toEqual([]);
    });

    it('should process content types with rich text fields correctly', () => {
      const contentTypes: ContentTypeProps[] = [
        {
          sys: { id: 'blog-post' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Text', required: false, localized: false },
            { id: 'content', name: 'Content', type: 'RichText', required: false, localized: false },
          ] as ContentTypeField[],
        } as ContentTypeProps,
        {
          sys: { id: 'article' },
          name: 'Article',
          fields: [
            { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false },
          ] as ContentTypeField[],
        } as ContentTypeProps,
      ];
      const result = processContentTypesToFields(contentTypes);
      expect(result).toEqual([
        {
          fieldUniqueId: 'article.body',
          displayName: 'Article > Body',
          contentTypeId: 'article',
          fieldId: 'body',
        },
        {
          fieldUniqueId: 'blog-post.content',
          displayName: 'Blog Post > Content',
          contentTypeId: 'blog-post',
          fieldId: 'content',
        },
      ]);
    });

    it('should sort fields by display name', () => {
      const contentTypes: ContentTypeProps[] = [
        {
          sys: { id: 'zebra' },
          name: 'Zebra',
          fields: [
            { id: 'content', name: 'Content', type: 'RichText', required: false, localized: false },
          ] as ContentTypeField[],
        } as ContentTypeProps,
        {
          sys: { id: 'alpha' },
          name: 'Alpha',
          fields: [
            { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false },
          ] as ContentTypeField[],
        } as ContentTypeProps,
      ];
      const result = processContentTypesToFields(contentTypes);
      expect(result[0].displayName).toBe('Alpha > Body');
      expect(result[1].displayName).toBe('Zebra > Content');
    });
  });

  describe('restoreSelectedFields', () => {
    it('should return empty array when no state is provided', () => {
      const availableFields = [
        {
          fieldUniqueId: 'blog-post.content',
          displayName: 'Blog Post > Content',
          contentTypeId: 'blog-post',
          fieldId: 'content',
        },
      ];
      const result = restoreSelectedFields(availableFields, { EditorInterface: {} });
      expect(result).toEqual([]);
    });

    it('should return empty array when no editor interface is provided', () => {
      const availableFields = [
        {
          fieldUniqueId: 'blog-post.content',
          displayName: 'Blog Post > Content',
          contentTypeId: 'blog-post',
          fieldId: 'content',
        },
      ];
      const result = restoreSelectedFields(availableFields, { EditorInterface: {} });
      expect(result).toEqual([]);
    });

    it('should restore fields that match the saved state', () => {
      const availableFields = [
        {
          fieldUniqueId: 'blog-post.content',
          displayName: 'Blog Post > Content',
          contentTypeId: 'blog-post',
          fieldId: 'content',
        },
        {
          fieldUniqueId: 'article.body',
          displayName: 'Article > Body',
          contentTypeId: 'article',
          fieldId: 'body',
        },
      ];
      const currentState = {
        EditorInterface: {
          'blog-post': {
            controls: [{ fieldId: 'content' }],
          },
          article: {
            controls: [{ fieldId: 'body' }],
          },
        },
      };
      const result = restoreSelectedFields(availableFields, currentState);
      expect(result).toEqual(availableFields);
    });

    it('should not restore fields that do not match the saved state', () => {
      const availableFields = [
        {
          fieldUniqueId: 'blog-post.content',
          displayName: 'Blog Post > Content',
          contentTypeId: 'blog-post',
          fieldId: 'content',
        },
        {
          fieldUniqueId: 'article.body',
          displayName: 'Article > Body',
          contentTypeId: 'article',
          fieldId: 'body',
        },
      ];
      const currentState = {
        EditorInterface: {
          'blog-post': {
            controls: [{ fieldId: 'content' }],
          },
        },
      };
      const result = restoreSelectedFields(availableFields, currentState);
      expect(result).toEqual([availableFields[0]]);
    });
  });
});
