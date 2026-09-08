export interface DocumentSelection {
  includeImages: boolean;
  selectedTabIds: string[];
}

export interface RunRecord {
  runId: string;
  documentTitle: string;
  documentId: string;
  contentTypeIds: string[];
  documentSelection: DocumentSelection;
  startedAt: string;
  createdEntryIds?: string[];
}

export type RecordRunParams = RunRecord;

export interface RemoveRunParams {
  runId: string;
}

export interface UpdateRunParams {
  runId: string;
  documentTitle?: string;
  documentId?: string;
  contentTypeIds?: string[];
  documentSelection?: DocumentSelection;
  startedAt?: string;
  createdEntryIds?: string[];
}

export type ListRunsParams = Record<string, never>;
