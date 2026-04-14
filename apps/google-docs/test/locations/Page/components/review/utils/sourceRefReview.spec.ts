import { describe, expect, it } from 'vitest';
import {
  getSourceRefKey,
  isImageSourceRefExcluded,
} from '../../../../../../src/locations/Page/components/review/utils/sourceRefReview';

describe('sourceRefReview', () => {
  it('getSourceRefKey is stable for block and table image refs', () => {
    expect(
      getSourceRefKey({
        type: 'blockImage',
        blockId: 'b1',
        imageId: 'img1',
      })
    ).toBe('blockImage:b1:img1');

    expect(
      getSourceRefKey({
        type: 'tableImage',
        tableId: 't1',
        rowId: 'r1',
        cellId: 'c1',
        partId: 'p1',
        imageId: 'img2',
      })
    ).toBe('tableImage:t1:r1:c1:p1:img2');
  });

  it('isImageSourceRefExcluded matches excluded list by key', () => {
    const ref = {
      type: 'blockImage' as const,
      blockId: 'b1',
      imageId: 'img1',
    };
    const excluded = [
      { type: 'blockText' as const, blockId: 'x', start: 0, end: 1, flattenedRuns: [] },
      { type: 'blockImage' as const, blockId: 'b1', imageId: 'img1' },
    ];
    expect(isImageSourceRefExcluded(ref, excluded)).toBe(true);
  });
});
