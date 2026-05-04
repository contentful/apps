import type { EntryBlockGraph, EntryBlockGraphEntry } from '../types/entryBlockGraph';

export function getEntrySelectionKey(entry: EntryBlockGraphEntry, index: number): string {
  return entry.tempId ?? String(index);
}

export function getAllEntrySelectionKeys(entries: EntryBlockGraphEntry[]): Set<string> {
  return new Set(entries.map((entry, index) => getEntrySelectionKey(entry, index)));
}

export function countSelectedEntries(
  entries: EntryBlockGraphEntry[],
  selectedEntryKeys: ReadonlySet<string>
): number {
  return entries.reduce(
    (count, entry, index) =>
      selectedEntryKeys.has(getEntrySelectionKey(entry, index)) ? count + 1 : count,
    0
  );
}

export function filterEntryBlockGraphBySelection(
  graph: EntryBlockGraph,
  selectedEntryKeys: ReadonlySet<string>
): EntryBlockGraph {
  const selectedEntries = graph.entries.filter((entry, index) =>
    selectedEntryKeys.has(getEntrySelectionKey(entry, index))
  );
  const selectedTempIds = new Set(
    selectedEntries
      .map((entry) => entry.tempId)
      .filter((tempId): tempId is string => typeof tempId === 'string')
  );

  return {
    ...graph,
    entries: selectedEntries.map((entry) => ({
      ...entry,
      fieldMappings: entry.fieldMappings.map((fieldMapping) => {
        if (!fieldMapping.sourceEntryIds) {
          return fieldMapping;
        }

        return {
          ...fieldMapping,
          sourceEntryIds: fieldMapping.sourceEntryIds.filter((id) => selectedTempIds.has(id)),
        };
      }),
    })),
  };
}
