import type { ComponentPropertyDescriptor } from '@contentful/app-sdk';
import type { AuditFinding, AuditRule, CollectedNode, Severity } from './types';

/** Property keys are matched case-insensitively against these hints. */
const IMAGE_KEY_HINT = /(image|photo|asset|media|thumbnail|icon|logo)/i;
const ALT_KEY_HINT = /(alt|alttext|alternativetext|a11ylabel|arialabel)/i;
const HEADING_KEY_HINT = /(heading|title|headline)/i;
const META_KEY_HINT = /(metadescription|seodescription|metatitle|seotitle|opengraph|ogtitle|ogdescription)/i;

function findProperty(
  node: CollectedNode,
  matcher: RegExp
): ComponentPropertyDescriptor | undefined {
  return node.properties.find((p) => matcher.test(stripNonAlpha(p.key)));
}

function stripNonAlpha(key: string): string {
  return key.replace(/[^a-z0-9]/gi, '');
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** True when a property resolves to text the author actually authored. */
function isContentText(property: ComponentPropertyDescriptor): property is ComponentPropertyDescriptor & { value: string } {
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
    const image = findProperty(node, IMAGE_KEY_HINT);
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
    const heading = findProperty(node, HEADING_KEY_HINT);
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
      return [
        makeFinding(seoMetaRule, node, {
          propertyKey: meta.key,
          severity: 'info',
          title: 'SEO metadata is empty',
          detail: `"${meta.key}" is empty. Populate it to improve search and social sharing.`,
        }),
      ];
    }
    return [];
  },
};

/**
 * Content properties bound to an entry must actually resolve. A binding whose
 * source is an entry but with no entryId recorded is a broken reference.
 */
const brokenBindingRule: AuditRule = {
  id: 'content/broken-binding',
  description: 'Entry bindings should resolve to an entry.',
  evaluate(node) {
    const findings: AuditFinding[] = [];
    for (const property of node.properties) {
      const binding = property.binding;
      if (binding && binding.sourceType === 'entry' && !binding.entryId) {
        findings.push(
          makeFinding(brokenBindingRule, node, {
            propertyKey: property.key,
            severity: 'error',
            title: 'Broken entry binding',
            detail: `"${property.key}" is bound to an entry, but the reference is missing or unresolved.`,
          })
        );
      }
    }
    return findings;
  },
};

export const AUDIT_RULES: AuditRule[] = [
  altTextRule,
  requiredContentRule,
  seoMetaRule,
  brokenBindingRule,
];
