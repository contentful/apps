import type {
  AssetToCreate,
  EntryToCreate,
} from '../../functions/agents/documentParserAgent/schema';
import type { ReviewedCreationPayload, ReviewedReferenceGraph } from './types';

/** Order entries by `referenceGraph.creationOrder`, then append any missing entries (original order). */
export function orderEntriesByCreationOrder(
  entries: EntryToCreate[],
  creationOrder: string[] | undefined
): EntryToCreate[] {
  if (!creationOrder || creationOrder.length === 0) {
    return entries;
  }

  const byTempId = new Map<string, EntryToCreate>();
  for (const e of entries) {
    if (e.tempId) {
      byTempId.set(e.tempId, e);
    }
  }

  const ordered: EntryToCreate[] = [];
  const placed = new Set<string>();

  // Ids in creationOrder that do not match any entry are ignored (they might be stale or from an older graph).
  for (const id of creationOrder) {
    const e = byTempId.get(id);
    if (e) {
      ordered.push(e);
      placed.add(id);
    }
  }

  for (const e of entries) {
    // Entries without tempId are added at the end (not in the reference graph).
    if (!e.tempId) {
      ordered.push(e);
    } else if (!placed.has(e.tempId)) {
      // Entries with tempId that are not in the reference graph are added at the end.
      ordered.push(e);
      placed.add(e.tempId);
    }
  }

  return ordered;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEntryToCreateShape(value: unknown): value is EntryToCreate {
  if (!isRecord(value)) return false;
  if (typeof value.contentTypeId !== 'string' || value.contentTypeId.trim() === '') return false;
  if (!isRecord(value.fields)) return false;
  return true;
}

function isAssetToCreateShape(value: unknown): value is AssetToCreate {
  return isRecord(value) && typeof value.url === 'string' && value.url.trim() !== '';
}

export function validateReviewedCreationShape(payload: unknown): ReviewedCreationPayload {
  if (!isRecord(payload)) {
    throw new Error('Reviewed payload must be a JSON object.');
  }

  if (!Array.isArray(payload.entries)) {
    throw new Error('Reviewed payload must include an entries array.');
  }

  for (const item of payload.entries) {
    if (!isEntryToCreateShape(item)) {
      throw new Error(
        'Each entry must include contentTypeId (string) and fields (object with locale keys).'
      );
    }
  }

  const assets: AssetToCreate[] = [];
  if (payload.assets !== undefined && payload.assets !== null) {
    if (!Array.isArray(payload.assets)) {
      throw new Error('assets must be an array when present.');
    }
    for (const item of payload.assets) {
      if (!isAssetToCreateShape(item)) {
        throw new Error('Each asset must include a non-empty url string.');
      }
      assets.push(item);
    }
  }

  let referenceGraph: ReviewedReferenceGraph | undefined;
  if (payload.referenceGraph !== undefined) {
    if (!isRecord(payload.referenceGraph)) {
      throw new Error('referenceGraph must be an object when present.');
    }
    const creationOrder = payload.referenceGraph.creationOrder;
    if (creationOrder !== undefined && !Array.isArray(creationOrder)) {
      throw new Error('referenceGraph.creationOrder must be an array when present.');
    }
    const rg = payload.referenceGraph;
    referenceGraph = {
      edges: Array.isArray(rg.edges) ? rg.edges : undefined,
      creationOrder: Array.isArray(creationOrder)
        ? creationOrder.filter((id): id is string => typeof id === 'string')
        : undefined,
      deferredFields: Array.isArray(rg.deferredFields) ? rg.deferredFields : undefined,
      hasCircularDependency:
        typeof rg.hasCircularDependency === 'boolean' ? rg.hasCircularDependency : undefined,
    };
  }

  return {
    entries: payload.entries as EntryToCreate[],
    assets,
    referenceGraph,
  };
}
