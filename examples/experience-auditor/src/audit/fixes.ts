import type { CollectedNode } from './types';
import { stripNonAlpha, HEADING_KEY_HINT, HEADING_LEVEL_HINT } from './keys';

/**
 * Derives a suggested SEO meta value from the node's heading, when one exists.
 * Pure: reads only the CollectedNode. Returns the trimmed heading text, or
 * `null` when there is no usable heading (the caller then offers no suggestion).
 *
 * `_metaKey` is accepted for symmetry with other derivations and future
 * per-key logic; the heading is the source regardless of which meta key is empty.
 */
export function suggestMetaFromHeading(node: CollectedNode, _metaKey: string): string | null {
  const heading = node.properties.find(
    (p) =>
      HEADING_KEY_HINT.test(stripNonAlpha(p.key)) && !HEADING_LEVEL_HINT.test(stripNonAlpha(p.key))
  );
  if (!heading || typeof heading.value !== 'string') return null;
  const trimmed = heading.value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
