import type { EntryToCreate, PreviewPayload } from '@types';
import { collectReferencedTempIdsFromEntry } from '../services/referenceResolution';
import { orderEntriesByCreationOrder } from './previewPayload';
import { type ContentTypeDisplayInfo, getEntryTitleFromPreviewData } from './getEntryTitle';

export interface CheckboxEntryListRow {
  id: string;
  entryIndex: number;
  contentTypeName: string;
  entryTitle?: string;
  children: CheckboxEntryListRow[];
}

/** Content type id → CMA display metadata (name + display field), not a full content type model. From {@link fetchContentTypesByIds}. */
export type ContentTypeDisplayInfoById = ReadonlyMap<string, ContentTypeDisplayInfo>;

interface OrderedEntriesContext {
  entries: EntryToCreate[];
  entriesByTempId: Map<string, EntryToCreate>;
  orderedIndexByTempId: Map<string, number>;
}

interface TreeBuildContext {
  orderedEntriesContext: OrderedEntriesContext;
  childTempIdsByParentTempId: Map<string, string[]>;
  contentTypeDisplayInfoById?: ContentTypeDisplayInfoById;
  defaultLocale?: string;
}

function resolveContentTypeLabel(
  contentTypeId: string,
  contentTypeDisplayInfoById?: ContentTypeDisplayInfoById
): string {
  const name = contentTypeDisplayInfoById?.get(contentTypeId)?.name?.trim();
  return name && name.length > 0 ? name : '';
}

function createRow(
  entry: EntryToCreate,
  entryIndex: number,
  children: CheckboxEntryListRow[] = [],
  id: string,
  contentTypeDisplayInfoById?: ContentTypeDisplayInfoById,
  defaultLocale?: string
): CheckboxEntryListRow {
  const contentTypeName = resolveContentTypeLabel(entry.contentTypeId, contentTypeDisplayInfoById);
  const title = getEntryTitleFromPreviewData(
    entry,
    defaultLocale ?? 'en-US',
    contentTypeDisplayInfoById?.get(entry.contentTypeId)
  );
  return {
    id,
    entryIndex,
    contentTypeName,
    entryTitle: title,
    children,
  };
}

/** Maps parent tempId → child tempIds referenced from that entry’s fields (first parent wins). */
function buildChildTempIdsByParentTempId(
  orderedEntriesContext: OrderedEntriesContext
): Map<string, string[]> {
  const childTempIdsByParentTempId = new Map<string, string[]>();
  const assignedChildIds = new Set<string>();

  for (const entry of orderedEntriesContext.entries) {
    if (!entry.tempId) continue;
    const referencedTempIds = collectReferencedTempIdsFromEntry(entry);

    for (const referencedTempId of referencedTempIds) {
      if (referencedTempId === entry.tempId) continue;
      if (!orderedEntriesContext.entriesByTempId.has(referencedTempId)) continue;
      if (assignedChildIds.has(referencedTempId)) continue;

      assignedChildIds.add(referencedTempId);
      const childTempIds = childTempIdsByParentTempId.get(entry.tempId) ?? [];
      childTempIds.push(referencedTempId);
      childTempIdsByParentTempId.set(entry.tempId, childTempIds);
    }
  }

  return childTempIdsByParentTempId;
}

function buildOrderedEntriesContext(orderedEntries: EntryToCreate[]): OrderedEntriesContext {
  const entriesByTempId = new Map<string, EntryToCreate>();
  const orderedIndexByTempId = new Map<string, number>();

  orderedEntries.forEach((entry, index) => {
    if (entry.tempId) {
      entriesByTempId.set(entry.tempId, entry);
      orderedIndexByTempId.set(entry.tempId, index);
    }
  });

  return {
    entries: orderedEntries,
    entriesByTempId,
    orderedIndexByTempId,
  };
}

function collectChildTempIds(childTempIdsByParentTempId: Map<string, string[]>): Set<string> {
  return new Set([...childTempIdsByParentTempId.values()].flat());
}

function buildRowTreeForTempId(
  tempId: string,
  context: TreeBuildContext
): CheckboxEntryListRow | undefined {
  const entry = context.orderedEntriesContext.entriesByTempId.get(tempId);
  if (!entry) return undefined;

  const entryIndex = context.orderedEntriesContext.orderedIndexByTempId.get(tempId) ?? -1;
  const childRows = (context.childTempIdsByParentTempId.get(tempId) ?? [])
    .map((childTempId) => buildRowTreeForTempId(childTempId, context))
    .filter((row): row is CheckboxEntryListRow => row !== undefined);

  return createRow(
    entry,
    entryIndex,
    childRows,
    tempId,
    context.contentTypeDisplayInfoById,
    context.defaultLocale
  );
}

/** Top-level rows: entries with a tempId that nothing else references as a child. */
function buildTreeRootRows(
  context: TreeBuildContext,
  childTempIds: Set<string>
): CheckboxEntryListRow[] {
  const roots: CheckboxEntryListRow[] = [];

  for (const entry of context.orderedEntriesContext.entries) {
    if (!entry.tempId) continue;
    if (childTempIds.has(entry.tempId)) continue;

    const row = buildRowTreeForTempId(entry.tempId, context);
    if (row) roots.push(row);
  }

  return roots;
}

/** Flat list of rows for entries that have a `tempId` (same order as `orderedEntries`, original indices preserved). */
function buildFlatRows(
  orderedEntries: EntryToCreate[],
  contentTypeDisplayInfoById?: ContentTypeDisplayInfoById,
  defaultLocale?: string
): CheckboxEntryListRow[] {
  const rows: CheckboxEntryListRow[] = [];
  orderedEntries.forEach((entry, index) => {
    if (!entry.tempId) return;
    rows.push(createRow(entry, index, [], entry.tempId, contentTypeDisplayInfoById, defaultLocale));
  });
  return rows;
}

/** Preview rows for the overview checklist: only entries with a `tempId` (required for stable row ids and selection). */
export function buildCheckboxEntryList(
  payload: PreviewPayload,
  contentTypeDisplayInfoById?: ContentTypeDisplayInfoById,
  defaultLocale?: string
): CheckboxEntryListRow[] {
  const { entries, referenceGraph } = payload;
  if (entries.length === 0) {
    return [];
  }

  const orderedEntriesContext = buildOrderedEntriesContext(
    orderEntriesByCreationOrder(entries, referenceGraph.creationOrder)
  );
  const childTempIdsByParentTempId = buildChildTempIdsByParentTempId(orderedEntriesContext);
  const roots = buildTreeRootRows(
    {
      orderedEntriesContext,
      childTempIdsByParentTempId,
      contentTypeDisplayInfoById,
      defaultLocale,
    },
    collectChildTempIds(childTempIdsByParentTempId)
  );

  if (roots.length === 0) {
    return buildFlatRows(orderedEntriesContext.entries, contentTypeDisplayInfoById, defaultLocale);
  }

  return roots;
}

export function collectCheckboxEntryListRowIds(rows: CheckboxEntryListRow[]): string[] {
  return rows.flatMap((row) => [row.id, ...collectCheckboxEntryListRowIds(row.children)]);
}

function collectSelectedEntryIndices(
  rows: CheckboxEntryListRow[],
  selectedRowIds: Set<string>
): number[] {
  return rows.flatMap((row) => [
    ...(selectedRowIds.has(row.id) ? [row.entryIndex] : []),
    ...collectSelectedEntryIndices(row.children, selectedRowIds),
  ]);
}

/**
 * Keeps only entries whose preview row is selected. Order matches creation order after filtering.
 */
export function filterPreviewPayloadBySelectedRowIds(
  payload: PreviewPayload,
  selectedRowIds: Set<string>
): PreviewPayload {
  const rows = buildCheckboxEntryList(payload);
  const indices = new Set(collectSelectedEntryIndices(rows, selectedRowIds));
  if (indices.size === 0) {
    return { ...payload, entries: [] };
  }
  const ordered = orderEntriesByCreationOrder(
    payload.entries,
    payload.referenceGraph.creationOrder
  );
  const filteredEntries = ordered.filter((_, i) => indices.has(i));
  return {
    ...payload,
    entries: filteredEntries,
  };
}
