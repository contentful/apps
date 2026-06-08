import type { CollectedNode } from './types';

/** Case-insensitive, punctuation-stripped key match (mirrors rules.ts). */
function stripNonAlpha(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '');
}

const HEADING_HINT = /(heading|headline|^title$|pagetitle)/i;

/**
 * Derives a suggested SEO meta value from the node's heading, when one exists.
 * Pure: reads only the CollectedNode. Returns the trimmed heading text, or
 * `null` when there is no usable heading (the caller then offers no suggestion).
 *
 * `_metaKey` is accepted for symmetry with other derivations and future
 * per-key logic; the heading is the source regardless of which meta key is empty.
 */
export function suggestMetaFromHeading(node: CollectedNode, _metaKey: string): string | null {
  const heading = node.properties.find((p) => HEADING_HINT.test(stripNonAlpha(p.key)));
  if (!heading || typeof heading.value !== 'string') return null;
  const trimmed = heading.value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
