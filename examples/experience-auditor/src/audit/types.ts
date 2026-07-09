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
 * Advisory fix attached to a finding. Both kinds are read-only — the app-sdk
 * surface exposes no host call to write a node's content properties, so the
 * auditor surfaces derived values for the author to apply manually.
 *
 * - `deterministic`: exactly one correct result (e.g. trimming whitespace).
 *   Shown as a direct hint.
 * - `suggested`: a proposed value the author should review before using (e.g.
 *   deriving a meta title from the heading). Shown with provenance so the
 *   author can judge it.
 */
export type AutoFix =
  | { kind: 'deterministic'; label: string; value: unknown }
  | {
      kind: 'suggested';
      label: string;
      /** Pre-filled proposed value. */
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
