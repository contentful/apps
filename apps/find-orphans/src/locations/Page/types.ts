import { PageAppSDK } from '@contentful/app-sdk';

export type CmaClient = PageAppSDK['cma'];

/** Which CMA entity a result is; decides how it is previewed and archived. */
export type OrphanKind = 'entry' | 'asset';

/**
 * What "orphan" means for a scan — untitled drafts (created by accident and
 * abandoned) or unreferenced drafts (no entry links to them). One criterion
 * per scan, chosen on the page, so results stay unambiguous.
 */
export type ScanCriterion = 'untitled' | 'unreferenced';

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
   * The item's title in the default locale, or undefined when it has none
   * (always undefined under the untitled criterion — that is what it finds;
   * unreferenced results usually have real titles). The UI renders undefined
   * as the editor's "Untitled" placeholder.
   */
  title: string | undefined;
  /**
   * Creation date, not last-updated: "when was this created" is what
   * identifies the mistake, and an edit date would understate its age.
   */
  createdAt: string;
  /**
   * True when the item was never saved after creation (sys.version === 1;
   * valid because published/archived states are excluded by the draft
   * queries). Feeds the "Never edited" results filter. Note that archiving
   * and unarchiving an item bumps its version, so restored orphans read as
   * edited.
   */
  neverEdited: boolean;
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
