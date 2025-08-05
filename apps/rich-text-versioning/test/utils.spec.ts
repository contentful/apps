import { describe, expect, it } from 'vitest';
import { getRichTextFields } from '../src/utils';

describe('Utils', () => {
  describe('getRichTextFields', () => {
    it('should return only rich text fields from a content type', () => {
      const contentType = {
        fields: [
          { id: 'title', name: 'Title', type: 'Text' },
          { id: 'content', name: 'Content', type: 'RichText' },
          { id: 'description', name: 'Description', type: 'Text' },
          { id: 'body', name: 'Body', type: 'RichText' },
          { id: 'author', name: 'Author', type: 'Link' },
        ],
      };

      const richTextFields = getRichTextFields(contentType);

      expect(richTextFields).toHaveLength(2);
      expect(richTextFields[0]).toEqual({
        id: 'content',
        name: 'Content',
        type: 'RichText',
      });
      expect(richTextFields[1]).toEqual({
        id: 'body',
        name: 'Body',
        type: 'RichText',
      });
    });

    it('should return empty array for content type with no rich text fields', () => {
      const contentType = {
        fields: [
          { id: 'title', name: 'Title', type: 'Text' },
          { id: 'author', name: 'Author', type: 'Link' },
          { id: 'published', name: 'Published', type: 'Boolean' },
        ],
      };

      const richTextFields = getRichTextFields(contentType);

      expect(richTextFields).toHaveLength(0);
    });

    it('should return empty array for content type with no fields', () => {
      const contentType = { fields: [] };
      const richTextFields = getRichTextFields(contentType);

      expect(richTextFields).toHaveLength(0);
    });

    it('should return empty array for content type without fields property', () => {
      const contentType = {};
      const richTextFields = getRichTextFields(contentType);

      expect(richTextFields).toHaveLength(0);
    });
  });
});
