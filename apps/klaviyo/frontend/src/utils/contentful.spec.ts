import { describe, it, expect } from 'vitest';
import { AVAILABLE_CONTENT_TYPES } from './contentful';

describe('contentful', () => {
  describe('AVAILABLE_CONTENT_TYPES', () => {
    it('should export an array of content type IDs', () => {
      expect(AVAILABLE_CONTENT_TYPES).toBeInstanceOf(Array);
      expect(AVAILABLE_CONTENT_TYPES.length).toBeGreaterThan(0);

      // Verify common content types are included
      expect(AVAILABLE_CONTENT_TYPES).toContain('page');
      expect(AVAILABLE_CONTENT_TYPES).toContain('blogPost');
      expect(AVAILABLE_CONTENT_TYPES).toContain('product');

      // Verify all elements are strings
      AVAILABLE_CONTENT_TYPES.forEach((contentType) => {
        expect(typeof contentType).toBe('string');
      });
    });
  });
});
