import type { NormalizedDocumentImage } from '@types';

/** Display title for review UI and mapping modals (matches ReviewImageAssetCard). */
export function getNormalizedImageDisplayName(image: NormalizedDocumentImage): string {
  return image.title ?? image.altText ?? image.fileName ?? 'Document image';
}
