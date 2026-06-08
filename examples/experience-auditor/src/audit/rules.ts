import type { ComponentPropertyDescriptor } from '@contentful/app-sdk';
import type { AuditFinding, AuditRule, CollectedNode, Severity } from './types';
import {
  stripNonAlpha,
  IMAGE_KEY_HINT,
  ALT_KEY_HINT,
  META_KEY_HINT,
  HEADING_KEY_HINT,
  HEADING_LEVEL_HINT,
} from './keys';
import { suggestMetaFromHeading } from './fixes';

function findProperty(
  node: CollectedNode,
  matcher: RegExp,
  predicate?: (p: ComponentPropertyDescriptor) => boolean
): ComponentPropertyDescriptor | undefined {
  return node.properties.find(
    (p) => matcher.test(stripNonAlpha(p.key)) && (!predicate || predicate(p))
  );
}

/**
 * Whether a property value looks like an actual image — an asset Link object
 * (`{ sys: { linkType: 'Asset', ... } }`) or an array of them. Matching on the
 * key alone is too loose: `iconName`, `logoText`, `assetId` are string labels,
 * not images, and flagging them for missing alt text produces false errors.
 */
function looksLikeImageValue(value: unknown): boolean {
  const isAssetLink = (v: unknown): boolean =>
    typeof v === 'object' && v !== null && 'sys' in (v as Record<string, unknown>);
  if (Array.isArray(value)) return value.some(isAssetLink);
  return isAssetLink(value);
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** True when a property resolves to text the author actually authored. */
function isContentText(
  property: ComponentPropertyDescriptor
): property is ComponentPropertyDescriptor & { value: string } {
  return property.area === 'content' && typeof property.value === 'string';
}

function makeFinding(
  rule: Pick<AuditRule, 'id'>,
  node: CollectedNode,
  partial: {
    propertyKey?: string;
    severity: Severity;
    title: string;
    detail: string;
    fix?: AuditFinding['fix'];
  }
): AuditFinding {
  return {
    id: `${rule.id}:${node.id}:${partial.propertyKey ?? ''}`,
    ruleId: rule.id,
    nodeId: node.id,
    nodeType: node.nodeType,
    ...partial,
  };
}

/**
 * Image properties must have accompanying alt text. Flags an image-like content
 * property whose sibling alt-text property is empty or missing. Where the alt
 * text exists but is only whitespace, offers a one-click trim fix.
 */
const altTextRule: AuditRule = {
  id: 'a11y/image-alt-text',
  description: 'Images should have non-empty alternative text.',
  evaluate(node) {
    // Require both an image-like key AND an asset-shaped value, so string
    // fields like `iconName`/`logoText` don't trigger false alt-text errors.
    const image = findProperty(node, IMAGE_KEY_HINT, (p) => looksLikeImageValue(p.value));
    if (!image || isEmptyValue(image.value)) {
      // No image set on this node — nothing to audit.
      return [];
    }

    const alt = findProperty(node, ALT_KEY_HINT);

    if (!alt || isEmptyValue(alt.value)) {
      return [
        makeFinding(altTextRule, node, {
          propertyKey: alt?.key,
          severity: 'error',
          title: 'Image is missing alt text',
          detail:
            'This component has an image but no alternative text. Screen readers cannot describe it.',
        }),
      ];
    }

    if (isContentText(alt) && alt.value !== alt.value.trim()) {
      return [
        makeFinding(altTextRule, node, {
          propertyKey: alt.key,
          severity: 'warning',
          title: 'Alt text has surrounding whitespace',
          detail: 'The alt text has leading or trailing whitespace.',
          fix: {
            kind: 'deterministic',
            label: 'Trim whitespace',
            propertyKey: alt.key,
            value: alt.value.trim(),
          },
        }),
      ];
    }

    return [];
  },
};

/**
 * Required content properties must not be empty. The host marks a property as
 * required via a convention on the descriptor; here we treat any empty content
 * text property whose key looks like a heading/title as required, plus any
 * property explicitly flagged. (Kept conservative to avoid false positives.)
 */
const requiredContentRule: AuditRule = {
  id: 'content/required-empty',
  description: 'Required content fields should not be empty.',
  evaluate(node) {
    // Exclude meta-ish keys so `metaTitle`/`seoTitle` are owned solely by the
    // SEO rule and don't double-fire here.
    const heading = findProperty(
      node,
      HEADING_KEY_HINT,
      (p) =>
        !META_KEY_HINT.test(stripNonAlpha(p.key)) && !HEADING_LEVEL_HINT.test(stripNonAlpha(p.key))
    );
    if (heading && heading.area === 'content' && isEmptyValue(heading.value)) {
      return [
        makeFinding(requiredContentRule, node, {
          propertyKey: heading.key,
          severity: 'warning',
          title: 'Heading is empty',
          detail: `"${heading.key}" has no value. Components usually need a heading to be useful.`,
        }),
      ];
    }
    return [];
  },
};

/**
 * SEO metadata should be present on the root of an experience. Flags a missing
 * or empty meta description / title when the node exposes such a property.
 */
const seoMetaRule: AuditRule = {
  id: 'seo/missing-meta',
  description: 'SEO metadata should be populated.',
  evaluate(node) {
    const meta = findProperty(node, META_KEY_HINT);
    if (meta && meta.area === 'content' && isEmptyValue(meta.value)) {
      const suggestion = suggestMetaFromHeading(node);
      return [
        makeFinding(seoMetaRule, node, {
          propertyKey: meta.key,
          severity: 'info',
          title: 'SEO metadata is empty',
          detail: `"${meta.key}" is empty. Populate it to improve search and social sharing.`,
          fix: suggestion
            ? {
                kind: 'suggested',
                label: 'Use heading as meta',
                propertyKey: meta.key,
                suggestedValue: suggestion,
                source: 'the heading on this component',
              }
            : undefined,
        }),
      ];
    }
    return [];
  },
};

/**
 * Content properties bound to an entry must actually resolve. When the collector
 * recorded a real resolution (`resolvedBindings`), prefer it: a binding is broken
 * iff it is an entry binding that did not resolve. Where no resolution is present
 * (host without `resolveEntryBinding`), fall back to the structural check — an
 * entry source with no recorded `entryId` is a broken reference.
 */
const brokenBindingRule: AuditRule = {
  id: 'content/broken-binding',
  description: 'Entry bindings should resolve to an entry.',
  evaluate(node) {
    const findings: AuditFinding[] = [];
    for (const property of node.properties) {
      const binding = property.binding;
      if (!binding || binding.sourceType !== 'entry') continue;

      const resolution = node.resolvedBindings?.[property.key];
      const broken = resolution ? !resolution.resolved : !binding.entryId;

      if (broken) {
        findings.push(
          makeFinding(brokenBindingRule, node, {
            propertyKey: property.key,
            severity: 'error',
            title: 'Broken entry binding',
            detail: `"${property.key}" is bound to an entry, but the reference does not resolve.`,
          })
        );
      }
    }
    return findings;
  },
};

function headingLevelOf(node: CollectedNode): { level: number; key: string } | undefined {
  const prop = node.properties.find((p) => HEADING_LEVEL_HINT.test(stripNonAlpha(p.key)));
  if (!prop || typeof prop.value !== 'number') return undefined;
  return { level: prop.value, key: prop.key };
}

/**
 * Heading levels should not skip (e.g. H2 -> H4 is an a11y/SEO problem).
 * Order-sensitive across nodes, so unlike the per-node rules this is applied by
 * the engine over the full node list.
 */
export function evaluateHeadingOrder(nodes: CollectedNode[]): AuditFinding[] {
  const findings: AuditFinding[] = [];
  let previous: number | undefined;
  for (const node of nodes) {
    const heading = headingLevelOf(node);
    if (heading === undefined) continue;
    const { level, key } = heading;
    if (previous !== undefined && level > previous + 1) {
      const expected = previous + 1;
      findings.push(
        makeFinding({ id: 'a11y/heading-order' }, node, {
          propertyKey: key,
          severity: 'warning',
          title: 'Heading level skips a level',
          detail: `This heading is H${level} but follows an H${previous}. Use H${expected} so the outline is sequential.`,
          fix: {
            kind: 'deterministic',
            label: `Set to H${expected}`,
            propertyKey: key,
            value: expected,
          },
        })
      );
    }
    previous = level;
  }
  return findings;
}

export const AUDIT_RULES: AuditRule[] = [
  altTextRule,
  requiredContentRule,
  seoMetaRule,
  brokenBindingRule,
];
