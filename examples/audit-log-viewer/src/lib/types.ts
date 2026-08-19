// Wire types for the listAuditLogFiles app action.
// Keep in sync with functions/lib/storage/types.ts (separate build roots — deliberate copy).
export interface LogFileRef {
  key: string;
  url: string;
  size: number;
  coveredDate: string;
}

export interface ListLogFilesResult {
  files: LogFileRef[];
  truncated: boolean;
}
