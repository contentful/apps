import { isBlockSourceRef, isTableImageSourceRef, isTextSourceRef, type SourceRef } from '@types';

const DEFAULT_CARD_GAP = 8;

export const getAnchorIdForSourceRef = (sourceRef: SourceRef): string => {
  if (isBlockSourceRef(sourceRef)) {
    return `block:${sourceRef.blockId}`;
  }

  if (isTextSourceRef(sourceRef) || isTableImageSourceRef(sourceRef)) {
    return `part:${sourceRef.tableId}:${sourceRef.rowId}:${sourceRef.cellId}:${sourceRef.partId}`;
  }

  return '';
};

export function resolveMarkerOffsets(
  cards: Array<{ key: string; rawTop: number; height: number }>,
  options?: { gap?: number }
): Record<string, number> {
  const gap = options?.gap ?? DEFAULT_CARD_GAP;

  const sortedCards = [...cards].sort(
    (left, right) => left.rawTop - right.rawTop || left.key.localeCompare(right.key)
  );
  const offsets: Record<string, number> = {};
  let previousBottom = -gap;

  sortedCards.forEach((card) => {
    const top = Math.max(0, card.rawTop, previousBottom + gap);
    offsets[card.key] = top;
    previousBottom = top + card.height;
  });

  return offsets;
}
