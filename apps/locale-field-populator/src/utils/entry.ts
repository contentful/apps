import { CMAClient, ContentTypeField } from '@contentful/app-sdk';
import { AdoptedFieldsMap, ReferencedEntryData } from './adoptedFields';
import { isEntryArrayField, isEntryField, isLinkArray, isLinkValue, LinkValue } from './fieldTypes';
import { EntryProps, ContentTypeProps } from 'contentful-management';

export interface UpdateResult {
  fieldsUpdated: number;
  entriesUpdated: number;
  entryId: string;
  errors?: string[];
}

async function updateSingleEntry(
  cma: CMAClient,
  entryId: string,
  sourceLocale: string,
  targetLocales: string[],
  adoptedFields: Record<string, boolean>
): Promise<{ fieldsUpdated: number; success: boolean; error?: string }> {
  try {
    const entry = await cma.entry.get({ entryId });

    let fieldsUpdated = 0;

    for (const [fieldId, isAdopted] of Object.entries(adoptedFields)) {
      if (!isAdopted) {
        continue;
      }

      const sourceValue = entry.fields[fieldId]?.[sourceLocale];

      for (const targetLocale of targetLocales) {
        if (!entry.fields[fieldId]) {
          entry.fields[fieldId] = {};
        }
        entry.fields[fieldId][targetLocale] = sourceValue;
      }

      fieldsUpdated++;
    }

    if (fieldsUpdated > 0) {
      await cma.entry.update({ entryId }, entry);
    }

    return { fieldsUpdated, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error updating entry';
    return { fieldsUpdated: 0, success: false, error: errorMessage };
  }
}

export async function updateEntries(
  cma: CMAClient,
  mainEntryId: string,
  sourceLocale: string,
  targetLocales: string[],
  adoptedFields: AdoptedFieldsMap
): Promise<UpdateResult> {
  const entriesToUpdate = Object.entries(adoptedFields).filter(([, entryAdoptedFields]) =>
    Object.values(entryAdoptedFields).some((adopted) => adopted)
  );

  let totalFieldsUpdated = 0;
  let entriesUpdated = 0;
  const errors: string[] = [];

  const batches = chunkArray(entriesToUpdate, UPDATE_CONCURRENCY);
  for (const batch of batches) {
    const results = await Promise.all(
      batch.map(([entryId, entryAdoptedFields]) =>
        updateSingleEntry(cma, entryId, sourceLocale, targetLocales, entryAdoptedFields)
      )
    );

    results.forEach((result, index) => {
      if (result.success) {
        totalFieldsUpdated += result.fieldsUpdated;
        if (result.fieldsUpdated > 0) {
          entriesUpdated++;
        }
      } else if (result.error) {
        errors.push(`Entry ${batch[index][0]}: ${result.error}`);
      }
    });
  }

  if (errors.length > 0) {
    return {
      fieldsUpdated: totalFieldsUpdated,
      entriesUpdated,
      entryId: mainEntryId,
      errors,
    };
  }

  return {
    fieldsUpdated: totalFieldsUpdated,
    entriesUpdated,
    entryId: mainEntryId,
  };
}

export const fetchEntryAndContentType = async (
  cma: CMAClient,
  entryId: string,
  contentTypeId: string
): Promise<{
  entry: EntryProps;
  contentType: ContentTypeProps;
}> => {
  const [entry, contentType] = await Promise.all([
    cma.entry.get({ entryId }),
    cma.contentType.get({ contentTypeId }),
  ]);
  return { entry, contentType };
};

export const MAX_REFERENCE_DEPTH = 5;
export const MIN_REFERENCE_DEPTH_OPTION = 0;
export const MAX_REFERENCE_DEPTH_OPTION = 10;

const BATCH_SIZE = 100;
const UPDATE_CONCURRENCY = 5;

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export const fetchReferencesForLocale = async (
  cma: CMAClient,
  entry: EntryProps,
  contentType: ContentTypeProps,
  sourceLocale: string,
  maxDepth: number = MAX_REFERENCE_DEPTH
): Promise<ReferencedEntryData[]> => {
  // `visited` does double duty: it suppresses re-traversal of a subtree and
  // it marks which entries already have a "real" entry section in the result
  // list. When the same entry is reached again from another path we emit a
  // pointer record instead of dropping it silently or rendering a misleading
  // empty section.
  const visited = new Set<string>([entry.sys.id]);
  const allReferences: ReferencedEntryData[] = [];
  const contentTypeCache: Record<string, ContentTypeProps> = {
    [contentType.sys.id]: contentType,
  };
  const entryCache: Record<string, EntryProps> = {
    [entry.sys.id]: entry,
  };

  await collectReferencesRecursive(
    cma,
    entry,
    contentType,
    sourceLocale,
    1,
    maxDepth,
    visited,
    allReferences,
    contentTypeCache,
    entryCache
  );

  return allReferences;
};

const collectReferencesRecursive = async (
  cma: CMAClient,
  parentEntry: EntryProps,
  parentContentType: ContentTypeProps,
  sourceLocale: string,
  currentDepth: number,
  maxDepth: number,
  visited: Set<string>,
  results: ReferencedEntryData[],
  contentTypeCache: Record<string, ContentTypeProps>,
  entryCache: Record<string, EntryProps>
): Promise<void> => {
  if (currentDepth > maxDepth) return;

  const referencesToProcess = collectReferences(parentEntry, parentContentType, sourceLocale);
  if (referencesToProcess.length === 0) return;

  const unfetchedIds = [
    ...new Set(referencesToProcess.map((r) => r.referenceEntryId).filter((id) => !entryCache[id])),
  ];

  if (unfetchedIds.length > 0) {
    const idChunks = chunkArray(unfetchedIds, BATCH_SIZE);
    for (const chunk of idChunks) {
      const entriesResponse = await cma.entry.getMany({
        query: { 'sys.id[in]': chunk.join(','), limit: BATCH_SIZE },
      });
      for (const fetchedEntry of entriesResponse.items) {
        entryCache[fetchedEntry.sys.id] = fetchedEntry;
      }
    }
  }

  const newContentTypeIds = [
    ...new Set(
      referencesToProcess
        .map((r) => entryCache[r.referenceEntryId]?.sys.contentType.sys.id)
        .filter((id): id is string => Boolean(id) && !contentTypeCache[id])
    ),
  ];
  if (newContentTypeIds.length > 0) {
    const ctChunks = chunkArray(newContentTypeIds, BATCH_SIZE);
    for (const chunk of ctChunks) {
      const ctResponse = await cma.contentType.getMany({
        query: { 'sys.id[in]': chunk.join(','), limit: BATCH_SIZE },
      });
      for (const ct of ctResponse.items) {
        contentTypeCache[ct.sys.id] = ct;
      }
    }
  }

  // Claim every direct reference of this parent before any recursion runs.
  // Without this, recursing into the first sibling would let it pick up later
  // siblings as its own descendants, pushing them deeper in the tree than they
  // actually live (and inverting which occurrence renders the full UI vs. the
  // "already included" pointer). Self-references are handled in the main loop
  // below, not here.
  const ownedRefIds = new Set<string>();
  for (const { referenceEntryId } of referencesToProcess) {
    if (referenceEntryId === parentEntry.sys.id) continue;
    if (visited.has(referenceEntryId)) continue;
    visited.add(referenceEntryId);
    ownedRefIds.add(referenceEntryId);
  }

  // Now walk the references in order. Each owned ref renders its full UI here
  // and recurses inline so its nested children appear immediately after it,
  // which is what the depth-based indentation in the render layer expects.
  for (const { referenceEntryId, field } of referencesToProcess) {
    if (referenceEntryId === parentEntry.sys.id) {
      results.push({
        entry: parentEntry,
        contentType: parentContentType,
        fieldId: field.id,
        fieldName: field.name,
        isSelfReference: true,
        depth: currentDepth,
      });
      continue;
    }

    const referenceEntry = entryCache[referenceEntryId];
    if (!referenceEntry) continue;

    const referenceContentType = contentTypeCache[referenceEntry.sys.contentType.sys.id];
    if (!referenceContentType) continue;

    if (!ownedRefIds.has(referenceEntryId)) {
      // Visited by an ancestor or earlier sibling at a shallower depth -- emit
      // a pointer record so the user sees the reference exists without a
      // misleading empty section.
      results.push({
        entry: referenceEntry,
        contentType: referenceContentType,
        fieldId: field.id,
        fieldName: field.name,
        isSelfReference: false,
        depth: currentDepth,
        isAlreadyIncluded: true,
      });
      continue;
    }

    results.push({
      entry: referenceEntry,
      contentType: referenceContentType,
      fieldId: field.id,
      fieldName: field.name,
      isSelfReference: false,
      depth: currentDepth,
    });

    if (currentDepth < maxDepth) {
      await collectReferencesRecursive(
        cma,
        referenceEntry,
        referenceContentType,
        sourceLocale,
        currentDepth + 1,
        maxDepth,
        visited,
        results,
        contentTypeCache,
        entryCache
      );
    }
  }
};

const collectReferences = (
  mainEntry: EntryProps,
  mainEntryContentType: ContentTypeProps,
  sourceLocale: string
) => {
  const referenceFields = mainEntryContentType.fields.filter(
    (field) => isEntryField(field) || isEntryArrayField(field)
  );

  const seenReferences = new Set<string>();
  const referencesToProcess: { referenceEntryId: string; field: ContentTypeField }[] = [];

  const processReference = (link: LinkValue, field: ContentTypeField) => {
    const referenceKey = `${link.sys.id}:${field.id}`;
    if (!seenReferences.has(referenceKey)) {
      seenReferences.add(referenceKey);
      referencesToProcess.push({ referenceEntryId: link.sys.id, field });
    }
  };

  for (const field of referenceFields) {
    const fieldValues = mainEntry.fields[field.id];
    if (!fieldValues) continue;

    let value = fieldValues[sourceLocale];
    // Non-localized reference fields store under a single key (the default locale)
    if (value === undefined && Object.keys(fieldValues).length === 1) {
      value = Object.values(fieldValues)[0];
    }
    if (value === undefined) continue;

    if (isLinkValue(value) && value.sys.linkType === 'Entry') {
      processReference(value, field);
    } else if (isLinkArray(value)) {
      for (const link of value) {
        if (link.sys.linkType === 'Entry') {
          processReference(link, field);
        }
      }
    }
  }

  return referencesToProcess;
};
