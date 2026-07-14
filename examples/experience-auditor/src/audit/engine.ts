import type { AuditFinding, AuditReport, AuditRule, CollectedNode, Severity } from './types';
import { AUDIT_RULES, evaluateHeadingOrder } from './rules';

/** Penalty applied to the health score per finding, by severity. */
const SEVERITY_WEIGHT: Record<Severity, number> = {
  error: 10,
  warning: 4,
  info: 1,
};

const EMPTY_COUNTS: Record<Severity, number> = { error: 0, warning: 0, info: 0 };

/**
 * Runs every rule over every collected node and aggregates the findings into a
 * report. Pure and synchronous — all async SDK work (resolving nodes and their
 * properties) happens in the collector before this is called, which keeps the
 * scoring logic trivially testable.
 */
export function runAudit(nodes: CollectedNode[], rules: AuditRule[] = AUDIT_RULES): AuditReport {
  const findings: AuditFinding[] = [];

  for (const node of nodes) {
    for (const rule of rules) {
      findings.push(...rule.evaluate(node));
    }
  }
  findings.push(...evaluateHeadingOrder(nodes));

  const counts = { ...EMPTY_COUNTS };
  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  return {
    findings: sortFindings(findings),
    score: computeScore(findings),
    counts,
    nodeCount: nodes.length,
  };
}

const SEVERITY_ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

/** Errors first, then warnings, then info; stable within a severity. */
function sortFindings(findings: AuditFinding[]): AuditFinding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/**
 * A 0–100 health score. Each finding subtracts its severity weight; the score
 * is clamped at 0. An experience with no findings scores 100.
 */
export function computeScore(findings: AuditFinding[]): number {
  const penalty = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  return Math.max(0, 100 - penalty);
}

export function hasBlockingErrors(report: AuditReport): boolean {
  return report.counts.error > 0;
}
