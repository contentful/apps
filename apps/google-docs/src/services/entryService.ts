import { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import type { EntryToCreate } from '../../functions/agents/documentParserAgent/schema';
import type { ReviewedCreationPayload } from '../utils/types';
import { mapFieldValuesToSpaceDefaultLocale } from '../utils/remapEntryLocales';
import { orderEntriesByCreationOrder } from '../utils/reviewedCreationPayload';
import {
  entryHasReferences,
  resolveReferences,
  separateReferenceFields,
} from './referenceResolution';

export async function createEntriesFromReviewedPayload(
  sdk: PageAppSDK | ConfigAppSDK,
  payload: ReviewedCreationPayload
): Promise<EntryProps[]> {
  const orderedEntries = orderEntriesByCreationOrder(
    payload.entries,
    payload.referenceGraph?.creationOrder
  );
  const entriesForSpaceLocale = mapFieldValuesToSpaceDefaultLocale(
    orderedEntries,
    sdk.locales.default
  );

  const contentTypeIds = [...new Set(entriesForSpaceLocale.map((entry) => entry.contentTypeId))];

  return createEntriesFromPreview(sdk, entriesForSpaceLocale, contentTypeIds);
}

/**
 * Creates multiple entries in Contentful using a two-pass approach
 *
 * This function handles:
 * 1. PASS 1: Create all entries WITHOUT reference fields (Contentful generates IDs)
 * 2. Build tempId -> realId mapping from created entries
 * 3. PASS 2: Update entries that have references with resolved reference fields
 * 4. Field values are sent as-is (Rich Text is expected as document JSON from the agent)
 *
 * @param sdk - Contentful SDK instance (PageAppSDK or ConfigAppSDK)
 * @param entries - Array of entries from Document Parser Agent output
 * @param contentTypeIds - Array of content type IDs to fetch and use
 * @returns Promise resolving to created entries
 */
export async function createEntriesFromPreview(
  sdk: PageAppSDK | ConfigAppSDK,
  entries: EntryToCreate[],
  contentTypeIds: string[]
): Promise<EntryProps[]> {
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;
  const cma = sdk.cma;

  // Map to track tempId -> actual Contentful entry ID (built during Pass 1)
  const tempIdToEntryId = new Map<string, string>();

  // Track created entries and their original entry data (for Pass 2)
  const createdEntriesMap = new Map<string, { created: EntryProps; original: EntryToCreate }>();
  const createdEntries: EntryProps[] = [];

  // PASS 1: Create all entries WITHOUT reference fields

  for (const entry of entries) {
    try {
      // Separate reference fields from non-reference fields
      const { nonRefFields } = separateReferenceFields(entry.fields);
      // Create the entry in Contentful (let Contentful generate the ID)
      const createdEntry = await cma.entry.create(
        { spaceId, environmentId, contentTypeId: entry.contentTypeId },
        { fields: nonRefFields }
      );

      // Map tempId to the real Contentful entry ID (used in Pass 2 to resolve references)
      if (entry.tempId) {
        tempIdToEntryId.set(entry.tempId, createdEntry.sys.id);
      }

      // Store for Pass 2
      createdEntriesMap.set(createdEntry.sys.id, { created: createdEntry, original: entry });
      createdEntries.push(createdEntry);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create entry ${entry.contentTypeId}: ${errorMessage}`);
    }
  }

  // PASS 2: Update entries that have reference fields
  for (const [entryId, { original }] of createdEntriesMap) {
    // Skip entries without references
    if (!entryHasReferences(original)) {
      continue;
    }

    try {
      // Extract only the reference fields
      const { refFields } = separateReferenceFields(original.fields);

      // Resolve references (now all IDs are known)
      const resolvedRefFields = resolveReferences(refFields, tempIdToEntryId);

      // Merge with existing fields and update the entry
      // Need to fetch the latest version to avoid version conflicts
      const latestEntry = await cma.entry.get({ spaceId, environmentId, entryId });

      const updatedFields = {
        ...latestEntry.fields,
        ...resolvedRefFields,
      };

      const updatedEntry = await cma.entry.update(
        { spaceId, environmentId, entryId },
        { ...latestEntry, fields: updatedFields }
      );

      // Update the entry in our results
      const index = createdEntries.findIndex((e) => e.sys.id === entryId);
      if (index !== -1) {
        createdEntries[index] = updatedEntry;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to add references to entry ${entryId}: ${errorMessage}`);
    }
  }

  return createdEntries;
}
