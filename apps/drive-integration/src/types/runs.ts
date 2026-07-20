export interface RunRecord {
  runId: string;
  documentTitle: string;
  documentId: string;
  contentTypeIds: string[];
  documentSelection: { includeImages: boolean; selectedTabIds: string[] };
  startedAt: string;
  createdEntryIds?: string[];
}

export type DisplayStatus =
  | 'loading'
  | 'running'
  | 'needs-review'
  | 'completed'
  | 'failed'
  | 'expired';

export interface RunWithStatus extends RunRecord {
  displayStatus: DisplayStatus;
  errorMessage?: string;
}

export type AppView = { view: 'runs' } | { view: 'review'; runId: string };
