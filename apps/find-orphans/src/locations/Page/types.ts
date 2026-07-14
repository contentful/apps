import { PageAppSDK } from '@contentful/app-sdk';

export type CmaClient = PageAppSDK['cma'];

/** Which CMA entity a result is; decides how it is previewed and archived. */
export type OrphanKind = 'entry' | 'asset';

/**
 * A draft entry or media asset flagged by the scan: its title has no value in
 * the default locale, which is the signature of an entity created by mistake
 * (e.g. from a reference field) and never filled in. The shape is flattened
 * to just what the UI and the archive action need, so entries and assets can
 * share one result list.
 */
export interface OrphanResult {
  kind: OrphanKind;
  id: string;
  /** Content type name for entries, "Asset" for media-library assets. */
  typeName: string;
  /**
   * Creation date, not last-updated: orphans were (by default) never edited
   * after creation, so "when was this created" is the honest column — and
   * with the untouched filter off, an edit date would understate the age of
   * the mistake.
   */
  createdAt: string;
  /**
   * Display name of whoever created the item, resolved from sys.createdBy
   * after the scan — "Jane Doe", "App" for app/automation identities, or
   * "Unknown user" when the creator cannot be resolved (e.g. left the
   * space, or the users lookup is not permitted).
   */
  createdBy: string;
}

export interface ScanProgress {
  /** Scan steps done so far: one per content type, plus one for assets. */
  current: number;
  total: number;
  /** What is being checked right now (content type names or "Assets"). */
  stepNames: string[];
}

export interface ScanOutcome {
  results: OrphanResult[];
  /** True when the scan hit the maxCandidates cap and stopped collecting further entries. */
  truncated: boolean;
}
