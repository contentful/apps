import { describe, expect, it } from 'vitest';
import { getSelectionViewportRectangle } from '../../src/hooks/useReviewTextSelection';

function createRootRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 600,
    height: 500,
    top: 0,
    left: 0,
    right: 600,
    bottom: 500,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect;
}

function createClientRect(overrides: Partial<DOMRect> = {}): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 24,
    top: 120,
    left: 80,
    right: 180,
    bottom: 144,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect;
}

function createRangeMock({
  clientRects,
  boundingRect,
}: {
  clientRects: DOMRect[];
  boundingRect: DOMRect;
}): Range {
  return {
    getClientRects: () => clientRects as unknown as DOMRectList,
    getBoundingClientRect: () => boundingRect,
  } as Range;
}

describe('getSelectionViewportRectangle', () => {
  it('anchors to the first visible client rect when a selection spans beyond the viewport', () => {
    const root = document.createElement('div');
    root.getBoundingClientRect = () => createRootRect({ top: 0, bottom: 500 });

    const range = createRangeMock({
      clientRects: [
        createClientRect({ top: -40, bottom: -10, left: 80, right: 180 }),
        createClientRect({ top: 96, bottom: 120, left: 90, right: 210 }),
      ],
      boundingRect: createClientRect({ top: -40, bottom: 120, left: 80, right: 210, height: 160 }),
    });

    expect(getSelectionViewportRectangle(range, root)).toEqual({
      top: 96,
      left: 90,
      bottom: 120,
      right: 210,
    });
  });

  it('returns null once the selection is fully outside the viewport', () => {
    const root = document.createElement('div');
    root.getBoundingClientRect = () => createRootRect({ top: 0, bottom: 500 });

    const range = createRangeMock({
      clientRects: [createClientRect({ top: -120, bottom: -96, left: 80, right: 180 })],
      boundingRect: createClientRect({ top: -120, bottom: -96, left: 80, right: 180 }),
    });

    expect(getSelectionViewportRectangle(range, root)).toBeNull();
  });

  it('treats the sticky header area as occluded viewport space', () => {
    const root = document.createElement('div');
    root.getBoundingClientRect = () => createRootRect({ top: 0, bottom: 500 });

    const range = createRangeMock({
      clientRects: [createClientRect({ top: 48, bottom: 72, left: 80, right: 180 })],
      boundingRect: createClientRect({ top: 48, bottom: 72, left: 80, right: 180 }),
    });

    expect(getSelectionViewportRectangle(range, root, 80)).toBeNull();
  });
});
