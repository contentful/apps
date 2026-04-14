import type { ImageSourceRef, SourceRef } from '@types';
import { isBlockImageSourceRef, isTableImageSourceRef } from '@types';

export function getSourceRefKey(ref: ImageSourceRef): string {
  if (ref.type === 'blockImage') {
    return `blockImage:${ref.blockId}:${ref.imageId}`;
  }
  return `tableImage:${ref.tableId}:${ref.rowId}:${ref.cellId}:${ref.partId}:${ref.imageId}`;
}

export function isImageSourceRefExcluded(ref: ImageSourceRef, excluded: SourceRef[]): boolean {
  return excluded.some((candidate) => {
    if (isBlockImageSourceRef(candidate) || isTableImageSourceRef(candidate)) {
      return getSourceRefKey(candidate) === getSourceRefKey(ref);
    }
    return false;
  });
}
