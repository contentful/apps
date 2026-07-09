import { PageAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps, EntryProps } from 'contentful-management';

export type CmaClient = PageAppSDK['cma'];

/**
 * A draft entry flagged by the scan: its display (title) field has no value
 * in the default locale, which is the signature of an entry created by
 * mistake (e.g. from a reference field) and never filled in.
 */
export interface OrphanResult {
  entry: EntryProps;
  contentType: ContentTypeProps;
}

export interface ScanProgress {
  /** Content types checked so far. */
  current: number;
  total: number;
  /** Names of the content types being checked right now. */
  contentTypeNames: string[];
}

export interface ScanOutcome {
  results: OrphanResult[];
  /** True when the scan hit the maxCandidates cap and stopped collecting further entries. */
  truncated: boolean;
}
