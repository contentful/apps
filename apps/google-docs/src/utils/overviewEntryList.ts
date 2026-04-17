import type { EntryToCreate, CompletedWorkflowPayload } from '@types';
import type { EntryBlockGraphEntry } from '../types/entryBlockGraph';
import type { WorkflowContentType } from '../types/workflow';
import { collectReferencedTempIdsFromEntry } from '../services/referenceResolution';
import { type ContentTypeDisplayInfo } from '../services/contentTypeService';
import { orderEntriesByCreationOrder } from './createEntries';
import { getEntryDisplayTitle } from './getEntryDisplayTitle';
import { getEntryTitleFromFieldMappings } from './getEntryTitle';

export interface EntryListRow {
  id: string;
  entryIndex: number;
  contentTypeName: string;
  entryTitle?: string;
  children: EntryListRow[];
}

export type ContentTypeDisplayInfoMap = ReadonlyMap<string, ContentTypeDisplayInfo>;

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
  children: EntryListRow[] = [],
  id: string,
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap,
  defaultLocale?: string
): EntryListRow {
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

function collectChildTempIds(childTempIdsByParentTempId: Map<string, string[]>): Set<string> {
  return new Set([...childTempIdsByParentTempId.values()].flat());
}

function buildRowTreeForTempId(
  tempId: string,
  context: TreeBuildContext
): EntryListRow | undefined {
  const entry = context.orderedEntriesContext.entriesByTempId.get(tempId);
  if (!entry) return undefined;

  const entryIndex = context.orderedEntriesContext.orderedIndexByTempId.get(tempId) ?? -1;
  const childRows = (context.childTempIdsByParentTempId.get(tempId) ?? [])
    .map((childTempId) => buildRowTreeForTempId(childTempId, context))
    .filter((row): row is EntryListRow => row !== undefined);

  return createRow(
    entry,
    entryIndex,
    childRows,
    tempId,
    context.contentTypeDisplayInfoMap,
    context.defaultLocale
  );
}

function buildTreeRootRows(context: TreeBuildContext, childTempIds: Set<string>): EntryListRow[] {
  const roots: EntryListRow[] = [];

  for (const entry of context.orderedEntriesContext.entries) {
    if (!entry.tempId) continue;
    if (childTempIds.has(entry.tempId)) continue;

    const row = buildRowTreeForTempId(entry.tempId, context);
    if (row) roots.push(row);
  }

  return roots;
}

function buildFlatRows(
  orderedEntries: EntryToCreate[],
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap,
  defaultLocale?: string
): EntryListRow[] {
  const rows: EntryListRow[] = [];
  orderedEntries.forEach((entry, index) => {
    if (!entry.tempId) return;
    rows.push(createRow(entry, index, [], entry.tempId, contentTypeDisplayInfoMap, defaultLocale));
  });
  return rows;
}

export function buildEntryList(
  payload: CompletedWorkflowPayload,
  contentTypeDisplayInfoMap?: ContentTypeDisplayInfoMap,
  defaultLocale?: string
): EntryListRow[] {
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

export function collectEntryListRowIds(rows: EntryListRow[]): string[] {
  return rows.flatMap((row) => [row.id, ...collectEntryListRowIds(row.children)]);
}

export function buildEntryListFromEntryBlockGraph(
  entries: EntryBlockGraphEntry[],
  contentTypes: WorkflowContentType[],
  referenceEdges?: Array<{ from: string; to: string }>
): EntryListRow[] {
  const contentTypeNameById = new Map(contentTypes.map((ct) => [ct.sys.id, ct.name ?? '']));
  const contentTypeDisplayInfoById = new Map(
    contentTypes.map((ct) => [ct.sys.id, { name: ct.name ?? '', displayField: ct.displayField }])
  );

  const indexByTempId = new Map<string, number>();
  entries.forEach((entry, index) => {
    if (entry.tempId) indexByTempId.set(entry.tempId, index);
  });

  // Build parent→children map from reference edges (edge.from is parent, edge.to is child)
  const childrenByParent = new Map<string, string[]>();
  const assignedChildren = new Set<string>();
  for (const edge of referenceEdges ?? []) {
    if (!edge.from || !edge.to) continue;
    if (!indexByTempId.has(edge.from) || !indexByTempId.has(edge.to)) continue;
    if (assignedChildren.has(edge.to)) continue;
    assignedChildren.add(edge.to);
    const children = childrenByParent.get(edge.from) ?? [];
    children.push(edge.to);
    childrenByParent.set(edge.from, children);
  }

  const makeRow = (entry: EntryBlockGraphEntry, index: number): EntryListRow => {
    const id = entry.tempId ?? String(index);
    const childTempIds = entry.tempId ? childrenByParent.get(entry.tempId) ?? [] : [];
    const childRows = childTempIds
      .map((childId) => {
        const childIndex = indexByTempId.get(childId);
        if (childIndex === undefined) return undefined;
        return makeRow(entries[childIndex], childIndex);
      })
      .filter((r): r is EntryListRow => r !== undefined);

    const contentTypeDisplayInfo = contentTypeDisplayInfoById.get(entry.contentTypeId);
    const entryTitle = getEntryTitleFromFieldMappings(entry, contentTypeDisplayInfo?.displayField);

    return {
      id,
      entryIndex: index,
      contentTypeName: contentTypeNameById.get(entry.contentTypeId) ?? entry.contentTypeId,
      entryTitle,
      children: childRows,
    };
  };

  // Only render root entries (those not assigned as children)
  return entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry.tempId || !assignedChildren.has(entry.tempId))
    .map(({ entry, index }) => makeRow(entry, index));
}
