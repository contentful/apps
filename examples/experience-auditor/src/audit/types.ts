import type { ComponentPropertyDescriptor, ExperienceNodeType } from '@contentful/app-sdk';

export type Severity = 'error' | 'warning' | 'info';

/**
 * A node collected from the experience tree, paired with its resolved
 * properties. This is the SDK-independent shape the audit rules operate on, so
 * the rules can be unit-tested without a live `sdk.experiences`.
 */
export interface CollectedNode {
  id: string;
  nodeType: ExperienceNodeType;
  properties: ComponentPropertyDescriptor[];
}

/**
 * A one-click fix for a finding.
 *
 * - `deterministic`: exactly one correct result (e.g. trimming whitespace).
 *   Applied immediately on click, no confirmation.
 * - `suggested`: a proposed value the author reviews and edits before it is
 *   written. Used where the fix is helpful but not unambiguous (e.g. deriving a
 *   meta title from the heading). We never write a suggested value silently.
 */
export type AutoFix =
  | { kind: 'deterministic'; label: string; propertyKey: string; value: unknown }
  | {
      kind: 'suggested';
      label: string;
      propertyKey: string;
      /** Pre-filled, editable proposed value. */
      suggestedValue: string;
      /** Human-readable provenance, e.g. "from the heading on this component". */
      source: string;
    };

export interface AuditFinding {
  /** Stable key for React lists and de-duplication. */
  id: string;
  ruleId: string;
  nodeId: string;
  nodeType: ExperienceNodeType;
  propertyKey?: string;
  severity: Severity;
  title: string;
  detail: string;
  fix?: AutoFix;
}

/** A pure audit rule: given one node, return zero or more findings. */
export interface AuditRule {
  id: string;
  description: string;
  evaluate(node: CollectedNode): AuditFinding[];
}

export interface AuditReport {
  findings: AuditFinding[];
  /** Overall health score, 0–100 (100 = no findings). */
  score: number;
  counts: Record<Severity, number>;
  nodeCount: number;
}

/** Which optional host surfaces are backed by the live `sdk.experiences`. */
export interface Capabilities {
  /** Selection/highlight (Locate-on-canvas). Not backed on the experience route yet. */
  selection: boolean;
}
