import type { EntryToCreate, MappingReviewSuspendPayload, PreviewPayload } from '@types';
import { collectReferencedTempIdsFromEntry } from '../services/referenceResolution';
import { type ContentTypeDisplayInfo } from '../services/contentTypeService';
import { orderEntriesByCreationOrder } from './previewPayload';
import { getEntryDisplayTitle } from './getEntryDisplayTitle';
import { isPreviewPayload } from './utils';

export interface CheckboxEntryListRow {
  id: string;
  entryIndex: number;
  contentTypeName: string;
  entryTitle?: string;
  children: CheckboxEntryListRow[];
}

export type ContentTypeDisplayInfoMap = ReadonlyMap<string, ContentTypeDisplayInfo>;

interface OverviewSourceEntry {
  tempId: string;
  contentTypeName: string;
  entryTitle?: string;
}

interface OrderedEntriesContext {
  entries: EntryToCreate[];
  entriesByTempId: Map<string, EntryToCreate>;
  orderedIndexByTempId: Map<string, number>;
}

interface TreeBuildContext {
  orderedEntriesContext: OrderedEntriesContext;
  childTempIdsByParentTempId: Map<string, string[]>;
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap;
  defaultLocale?: string;
}

interface OverviewSourceTreeBuildContext {
  orderedEntriesContext: OrderedOverviewSourceEntriesContext;
  childTempIdsByParentTempId: Map<string, string[]>;
}

interface OrderedOverviewSourceEntriesContext {
  entries: OverviewSourceEntry[];
  entriesByTempId: Map<string, OverviewSourceEntry>;
  orderedIndexByTempId: Map<string, number>;
}

function resolveContentTypeLabel(
  contentTypeId: string,
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap
): string {
  const name = contentTypeDisplayInfoMap?.get(contentTypeId)?.name?.trim();
  return name && name.length > 0 ? name : '';
}

function createRow(
  entry: EntryToCreate,
  entryIndex: number,
  children: CheckboxEntryListRow[] = [],
  id: string,
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap,
  defaultLocale?: string
): CheckboxEntryListRow {
  const contentTypeName = resolveContentTypeLabel(entry.contentTypeId, contentTypeDisplayInfoMap);
  const title = getEntryDisplayTitle(
    entry,
    defaultLocale ?? 'en-US',
    contentTypeDisplayInfoMap?.get(entry.contentTypeId)
  );
  return {
    id,
    entryIndex,
    contentTypeName,
    entryTitle: title,
    children,
  };
}

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

function buildOrderedOverviewSourceEntriesContext(
  orderedEntries: OverviewSourceEntry[]
): OrderedOverviewSourceEntriesContext {
  const entriesByTempId = new Map<string, OverviewSourceEntry>();
  const orderedIndexByTempId = new Map<string, number>();

  orderedEntries.forEach((entry, index) => {
    entriesByTempId.set(entry.tempId, entry);
    orderedIndexByTempId.set(entry.tempId, index);
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
    context.contentTypeDisplayInfoMap,
    context.defaultLocale
  );
}

function buildOverviewRow(
  entry: OverviewSourceEntry,
  entryIndex: number,
  children: CheckboxEntryListRow[]
) {
  return {
    id: entry.tempId,
    entryIndex,
    contentTypeName: entry.contentTypeName,
    entryTitle: entry.entryTitle,
    children,
  };
}

function buildOverviewRowTreeForTempId(
  tempId: string,
  context: OverviewSourceTreeBuildContext
): CheckboxEntryListRow | undefined {
  const entry = context.orderedEntriesContext.entriesByTempId.get(tempId);
  if (!entry) return undefined;

  const entryIndex = context.orderedEntriesContext.orderedIndexByTempId.get(tempId) ?? -1;
  const childRows = (context.childTempIdsByParentTempId.get(tempId) ?? [])
    .map((childTempId) => buildOverviewRowTreeForTempId(childTempId, context))
    .filter((row): row is CheckboxEntryListRow => row !== undefined);

  return buildOverviewRow(entry, entryIndex, childRows);
}

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

function buildOverviewTreeRootRows(
  context: OverviewSourceTreeBuildContext,
  childTempIds: Set<string>
): CheckboxEntryListRow[] {
  const roots: CheckboxEntryListRow[] = [];

  for (const entry of context.orderedEntriesContext.entries) {
    if (childTempIds.has(entry.tempId)) continue;

    const row = buildOverviewRowTreeForTempId(entry.tempId, context);
    if (row) roots.push(row);
  }

  return roots;
}

function buildFlatRows(
  orderedEntries: EntryToCreate[],
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap,
  defaultLocale?: string
): CheckboxEntryListRow[] {
  const rows: CheckboxEntryListRow[] = [];
  orderedEntries.forEach((entry, index) => {
    if (!entry.tempId) return;
    rows.push(createRow(entry, index, [], entry.tempId, contentTypeDisplayInfoMap, defaultLocale));
  });
  return rows;
}

function buildFlatOverviewRows(orderedEntries: OverviewSourceEntry[]): CheckboxEntryListRow[] {
  return orderedEntries.map((entry, index) => buildOverviewRow(entry, index, []));
}

function orderMappingReviewEntriesByCreationOrder(
  entries: MappingReviewSuspendPayload['entryBlockGraph']['entries'],
  creationOrder: string[] | undefined
): MappingReviewSuspendPayload['entryBlockGraph']['entries'] {
  if (!creationOrder || creationOrder.length === 0) {
    return entries;
  }

  const byTempId = new Map<
    string,
    MappingReviewSuspendPayload['entryBlockGraph']['entries'][number]
  >();
  for (const entry of entries) {
    if (entry.tempId) {
      byTempId.set(entry.tempId, entry);
    }
  }

  const ordered: MappingReviewSuspendPayload['entryBlockGraph']['entries'] = [];
  const placed = new Set<string>();

  for (const tempId of creationOrder) {
    if (placed.has(tempId)) continue;
    const entry = byTempId.get(tempId);
    if (entry) {
      ordered.push(entry);
      placed.add(tempId);
    }
  }

  for (const entry of entries) {
    if (!entry.tempId || !placed.has(entry.tempId)) {
      ordered.push(entry);
      if (entry.tempId) {
        placed.add(entry.tempId);
      }
    }
  }

  return ordered;
}

function buildChildTempIdsByParentTempIdFromReferenceGraph(
  orderedEntriesContext: OrderedOverviewSourceEntriesContext,
  referenceGraph: MappingReviewSuspendPayload['referenceGraph']
): Map<string, string[]> {
  const childTempIdsByParentTempId = new Map<string, string[]>();
  const assignedChildIds = new Set<string>();
  const childTempIdsByParent = new Map<string, string[]>();

  for (const edge of referenceGraph.edges ?? []) {
    if (typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      continue;
    }

    const existing = childTempIdsByParent.get(edge.from) ?? [];
    existing.push(edge.to);
    childTempIdsByParent.set(edge.from, existing);
  }

  for (const entry of orderedEntriesContext.entries) {
    const referencedTempIds = childTempIdsByParent.get(entry.tempId) ?? [];

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

export function buildCheckboxEntryList(
  payload: PreviewPayload,
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap,
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
      contentTypeDisplayInfoMap,
      defaultLocale,
    },
    collectChildTempIds(childTempIdsByParentTempId)
  );

  if (roots.length === 0) {
    return buildFlatRows(orderedEntriesContext.entries, contentTypeDisplayInfoMap, defaultLocale);
  }

  return roots;
}

export function buildCheckboxEntryListFromMappingReviewPayload(
  payload: MappingReviewSuspendPayload
): CheckboxEntryListRow[] {
  const orderedGraphEntries = orderMappingReviewEntriesByCreationOrder(
    payload.entryBlockGraph.entries,
    payload.referenceGraph.creationOrder
  );

  const orderedOverviewEntries: OverviewSourceEntry[] = orderedGraphEntries
    .map((entry) => {
      const tempId = entry.tempId?.trim();
      if (!tempId) {
        return null;
      }

      const matchingContentType = payload.contentTypes.find(
        (contentType) => contentType.sys.id === entry.contentTypeId
      );

      return {
        tempId,
        contentTypeName: matchingContentType?.name?.trim() || entry.contentTypeId,
        entryTitle: tempId,
      } satisfies OverviewSourceEntry;
    })
    .filter((entry): entry is OverviewSourceEntry => entry !== null);

  if (orderedOverviewEntries.length === 0) {
    return [];
  }

  const orderedEntriesContext = buildOrderedOverviewSourceEntriesContext(orderedOverviewEntries);
  const childTempIdsByParentTempId = buildChildTempIdsByParentTempIdFromReferenceGraph(
    orderedEntriesContext,
    payload.referenceGraph
  );
  const roots = buildOverviewTreeRootRows(
    {
      orderedEntriesContext,
      childTempIdsByParentTempId,
    },
    collectChildTempIds(childTempIdsByParentTempId)
  );

  if (roots.length === 0) {
    return buildFlatOverviewRows(orderedOverviewEntries);
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
