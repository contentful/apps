import type { ComponentPropertyDescriptor, ExoNodeType } from '@contentful/app-sdk';

export type Severity = 'error' | 'warning' | 'info';

/**
 * A node collected from the experience tree, paired with its resolved
 * properties. This is the SDK-independent shape the audit rules operate on, so
 * the rules can be unit-tested without a live `sdk.exo`.
 */
export interface CollectedNode {
  id: string;
  nodeType: ExoNodeType;
  properties: ComponentPropertyDescriptor[];
}

/**
 * A deterministic, one-click fix for a finding. When present, the UI offers a
 * "Fix" action that writes `value` to `propertyKey` via `setContentProperty`.
 * Only safe, non-destructive transforms (e.g. trimming whitespace) carry a fix
 * — we never invent content the author hasn't written.
 */
export interface AutoFix {
  label: string;
  propertyKey: string;
  value: unknown;
}

export interface AuditFinding {
  /** Stable key for React lists and de-duplication. */
  id: string;
  ruleId: string;
  nodeId: string;
  nodeType: ExoNodeType;
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
