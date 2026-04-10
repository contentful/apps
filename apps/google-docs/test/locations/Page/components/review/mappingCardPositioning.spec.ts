import { describe, expect, it } from 'vitest';

import {
  getAnchorIdForSourceRef,
  resolveMarkerOffsets,
} from '../../../../../src/locations/Page/components/review/mappingCardPositioning';

describe('mappingCardPositioning', () => {
  it('derives block and table anchors from source refs', () => {
    expect(
      getAnchorIdForSourceRef({
        kind: 'blockText',
        blockId: 'block-1',
        start: 0,
        end: 5,
        flattenedRuns: [],
      })
    ).toBe('block:block-1');

    expect(
      getAnchorIdForSourceRef({
        kind: 'tableImage',
        tableId: 'table-0',
        rowId: 'table-0-row-2',
        cellId: 'table-0-row-2-cell-1',
        partId: 'table-0-row-2-cell-1-part-0',
        imageId: 'img-0',
      })
    ).toBe('row:table-0:table-0-row-2');
  });

  it('stacks overlapping cards while preserving raw anchor order', () => {
    expect(
      resolveMarkerOffsets(
        [
          { key: 'first', rawTop: 100, height: 28 },
          { key: 'second', rawTop: 100, height: 28 },
          { key: 'third', rawTop: 140, height: 28 },
        ],
        { gap: 8 }
      )
    ).toEqual({
      first: 100,
      second: 136,
      third: 172,
    });
  });
});
