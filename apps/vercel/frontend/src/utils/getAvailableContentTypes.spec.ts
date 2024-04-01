import { describe, expect, it } from 'vitest';
import { getAvailableContentTypes } from './getAvailableContentTypes';
import { mockContentTypes } from '@test/mocks/mockContentTypes';
import { mockContentTypePreviewPathSelections } from '@test/mocks/mockContentTypePreviewPathSelections';
import { ContentType } from '@contentful/app-sdk';

describe('getAvailableContentTypes', () => {
  it('should filter content types when current selection is not provided', () => {
    const result: ContentType[] = getAvailableContentTypes(
      mockContentTypes,
      mockContentTypePreviewPathSelections
    )();

    expect(result).toHaveLength(1);
    expect(result[0].sys.id).toBe(mockContentTypes[2].sys.id);
  });

  it('should filter content types when current selection is provided', () => {
    const result: ContentType[] = getAvailableContentTypes(
      mockContentTypes,
      mockContentTypePreviewPathSelections
    )('blog');

    expect(result).toHaveLength(2);
    expect(result[0].sys.id).toBe(mockContentTypes[0].sys.id);
    expect(result[1].sys.id).toBe(mockContentTypes[2].sys.id);
  });
});
