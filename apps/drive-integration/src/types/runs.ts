export interface RunRecord {
  runId: string;
  documentTitle: string;
  documentId: string;
  contentTypeIds: string[];
  documentSelection: { includeImages: boolean; selectedTabIds: string[] };
  startedAt: string;
  createdEntryIds?: string[];
}

export enum DisplayStatus {
  LOADING = 'loading',
  RUNNING = 'running',
  NEEDS_REVIEW = 'needs-review',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export interface RunWithStatus extends RunRecord {
  displayStatus: DisplayStatus;
  errorMessage?: string;
}

export enum AppViewKind {
  RUNS = 'runs',
  REVIEW = 'review',
}

export type AppView = { view: AppViewKind.RUNS } | { view: AppViewKind.REVIEW; runId: string };
