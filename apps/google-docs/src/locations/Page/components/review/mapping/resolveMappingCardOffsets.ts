import { isBlockSourceRef, type SourceRef } from '@types';

const DEFAULT_CARD_GAP = 8;

export const getAnchorIdForSourceRef = (sourceRef: SourceRef): string =>
  isBlockSourceRef(sourceRef)
    ? `block:${sourceRef.blockId}`
    : `row:${sourceRef.tableId}:${sourceRef.rowId}`;

export function resolveMarkerOffsets(
  cards: Array<{ key: string; rawTop: number; height: number }>,
  options?: { gap?: number }
): Record<string, number> {
  const gap = options?.gap ?? DEFAULT_CARD_GAP;

  const sortedCards = [...cards].sort((left, right) => left.rawTop - right.rawTop);
  const offsets: Record<string, number> = {};
  let previousBottom = 0;

  sortedCards.forEach((card) => {
    const top = Math.max(0, card.rawTop, previousBottom);
    offsets[card.key] = top;
    previousBottom = top + card.height + gap;
  });

  return offsets;
}
