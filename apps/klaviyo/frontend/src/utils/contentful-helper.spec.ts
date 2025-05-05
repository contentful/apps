import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getContentTypes } from './contentful-helper';

describe('contentful-helper', () => {
  // Spy on console.error
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getContentTypes', () => {
    it.only('should return content types from the CMA', async () => {
      // Mock content types
      const mockContentTypes = [
        { sys: { id: 'page' }, name: 'Page' },
        { sys: { id: 'blogPost' }, name: 'Blog Post' },
      ];

      // Mock CMA client
      const mockCma = {
        contentType: {
          getMany: vi.fn().mockResolvedValue({
            items: mockContentTypes,
          }),
        },
      };

      const result = await getContentTypes(mockCma);

      expect(result).toEqual(mockContentTypes);
      expect(mockCma.contentType.getMany).toHaveBeenCalledWith({});
    });

    it('should return empty array when CMA returns no items', async () => {
      // Mock CMA client
      const mockCma = {
        contentType: {
          getMany: vi.fn().mockResolvedValue({}),
        },
      };

      const result = await getContentTypes(mockCma);

      expect(result).toEqual([]);
    });

    it('should handle errors and return empty array', async () => {
      // Mock CMA client with error
      const mockCma = {
        contentType: {
          getMany: vi.fn().mockRejectedValue(new Error('API error')),
        },
      };

      const result = await getContentTypes(mockCma);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching content types:',
        expect.any(Error)
      );
    });
  });
});
