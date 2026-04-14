import type { EntryBlockGraph, WorkflowContentType } from '@types';

export interface DocumentOutlineOverviewEntry {
  key: string;
  entryIndex: number;
  title: string;
}

// TODO: replace this with the overview section component once it is compatible with entryBlockGraph
export function buildOverviewEntries(
  entries: EntryBlockGraph['entries'],
  contentTypes: WorkflowContentType[]
): DocumentOutlineOverviewEntry[] {
  return entries.map((graphEntry, entryIndex) => {
    const contentTypeName = contentTypes.find(
      (contentType) => contentType.sys.id === graphEntry.contentTypeId
    )?.name;
    const displayName = contentTypeName ?? 'Untitled';

    return {
      key: graphEntry.tempId ?? `${graphEntry.contentTypeId}-${entryIndex}`,
      entryIndex,
      title: displayName,
    };
  });
}
