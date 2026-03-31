import { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { EntryToCreate, AssetToCreate } from '../../functions/agents/documentParserAgent/schema';
import { normalizeAgentRichTextJson } from './richtext';
import {
  entryHasReferences,
  separateReferenceFields,
  resolveReferences,
} from './referenceResolution';
import { ReviewedCreationPayload } from '../utils/types';
import { orderEntriesByCreationOrder } from '../utils/reviewedCreationPayload';
import { mapFieldValuesToSpaceDefaultLocale } from '../utils/remapEntryLocales';

/**
 * Service for creating entries in Contentful using the Contentful Management API
 *
 * This service takes the output from the Document Parser Agent (which extracts entries from documents)
 * and creates them in Contentful using the CMA client from the SDK.
 */

export interface EntryCreationResult {
  createdEntries: EntryProps[];
  errors: Array<{
    contentTypeId: string;
    error: string;
    details?: any;
  }>;
}

/**
 * Creates an asset quickly without waiting for processing/publishing.
 * This is optimized for speed to avoid timeouts when processing many images.
 * The asset will be processed and published by Contentful in the background.
 */
async function createAssetFromUrlFast(
  cma: PageAppSDK['cma'] | ConfigAppSDK['cma'],
  spaceId: string,
  environmentId: string,
  url: string,
  defaultLocale: string,
  metadata?: { title?: string; altText?: string; fileName?: string; contentType?: string }
) {
  // Validate inputs
  if (!cma) {
    throw new Error('CMA client is required');
  }
  if (!spaceId || spaceId.trim().length === 0) {
    throw new Error('spaceId is required and must be a non-empty string');
  }
  if (!environmentId || environmentId.trim().length === 0) {
    throw new Error('environmentId is required and must be a non-empty string');
  }

  // Use metadata if provided, otherwise extract from URL
  const fileName = metadata?.fileName || 'image.jpg';
  const contentType = metadata?.contentType || 'image/jpeg';
  const title = metadata?.title || metadata?.altText || 'Image';

  // Create asset without waiting for processing/publishing
  // Contentful will process and publish it in the background
  const asset = await cma.asset.create(
    { spaceId, environmentId },
    {
      fields: {
        title: { [defaultLocale]: title },
        file: {
          [defaultLocale]: {
            contentType,
            fileName,
            upload: url,
          },
        },
      },
    }
  );

  // Trigger processing in the background (don't wait for it)
  cma.asset.processForAllLocales({ spaceId, environmentId }, asset).catch(() => {
    // Silently fail - processing will be retried by Contentful
  });

  // Note: Assets are created as drafts. They can be published later if needed.
  // Entries can reference draft assets without issues. Publishing is only required
  // if assets need to be accessible via the Delivery API (public access).

  return asset;
}

async function transformFieldsForContentType(
  fields: Record<string, Record<string, unknown>>,
  contentType: ContentTypeProps | undefined,
  urlToAssetId?: Record<string, string>
) {
  if (!contentType) return fields;

  const fieldDefs = new Map(contentType.fields.map((f) => [f.id, f]));
  const transformed: Record<string, Record<string, unknown>> = {};

  for (const [fieldId, localizedValue] of Object.entries(fields)) {
    const def = fieldDefs.get(fieldId);
    if (!def) {
      transformed[fieldId] = localizedValue;
      continue;
    }

    const perLocale: Record<string, unknown> = {};
    for (const [locale, value] of Object.entries(localizedValue)) {
      if (def.type === 'RichText') {
        const assetMap =
          urlToAssetId && Object.keys(urlToAssetId).length > 0 ? urlToAssetId : undefined;
        perLocale[locale] = normalizeAgentRichTextJson(value, assetMap);
      } else {
        // Apply field validation rules before setting the value
        perLocale[locale] = value;
      }
    }

    transformed[fieldId] = perLocale;
  }

  return transformed;
}

/**
 * Creates assets from the agent output and builds a lookup map for Rich Text asset links.
 *
 * Keys include:
 * - placeholderId (e.g. img-0) when the agent sets it on the asset
 * - normalizedUrl, composite URL+alt, and drawing variant for any legacy lookups
 */
async function createAssetsFromAgentOutput(
  cma: PageAppSDK['cma'] | ConfigAppSDK['cma'],
  spaceId: string,
  environmentId: string,
  defaultLocale: string,
  assets: AssetToCreate[]
): Promise<Record<string, string>> {
  const urlToAssetId: Record<string, string> = {};

  if (!assets || assets.length === 0) {
    return urlToAssetId;
  }

  const assetCreationPromises = assets.map(async (asset) => {
    try {
      const createdAsset = await createAssetFromUrlFast(
        cma,
        spaceId,
        environmentId,
        asset.url,
        defaultLocale,
        {
          title: asset.title || asset.altText || 'Image',
          altText: asset.altText,
          fileName: asset.fileName,
          contentType: asset.contentType,
        }
      );

      const normalizedUrl = asset.url.replace(/\s+/g, '');
      const altText = asset.altText || '';

      return {
        normalizedUrl,
        altText,
        assetId: createdAsset.sys.id,
      };
    } catch (error) {
      console.error(`Failed to create asset for URL: ${asset.url.substring(0, 100)}...`, error);
      return null;
    }
  });

  const results = await Promise.all(assetCreationPromises);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (!result) continue;

    const { normalizedUrl, altText, assetId } = result;
    const placeholderId = assets[i]?.placeholderId;

    if (placeholderId) {
      urlToAssetId[placeholderId] = assetId;
    }

    // Map normalized URL (primary lookup)
    urlToAssetId[normalizedUrl] = assetId;

    // Map composite key: `${normalizedUrl}::${altText || 'image'}`
    const compositeKey = `${normalizedUrl}::${altText || 'image'}`;
    urlToAssetId[compositeKey] = assetId;

    // Map drawing-specific key if applicable
    if (altText.toLowerCase().includes('drawing')) {
      urlToAssetId[`${normalizedUrl}::drawing`] = assetId;
    }
  }

  return urlToAssetId;
}

export async function createEntriesFromReviewedPayload(
  sdk: PageAppSDK | ConfigAppSDK,
  payload: ReviewedCreationPayload
): Promise<EntryCreationResult> {
  const orderedEntries = orderEntriesByCreationOrder(
    payload.entries,
    payload.referenceGraph?.creationOrder
  );
  const entriesForSpaceLocale = mapFieldValuesToSpaceDefaultLocale(
    orderedEntries,
    sdk.locales.default
  );
  const contentTypeIds = [...new Set(entriesForSpaceLocale.map((e) => e.contentTypeId))];

  return createEntriesFromPreview(sdk, entriesForSpaceLocale, contentTypeIds, payload.assets);
}

/**
 * Creates multiple entries in Contentful using a two-pass approach
 *
 * This function handles:
 * 1. ASSET CREATION: Create all assets from agent output first (assets are identified by the AI agent, not parsed from RichText)
 * 2. PASS 1: Create all entries WITHOUT reference fields (Contentful generates IDs)
 * 3. Build tempId -> realId mapping from created entries
 * 4. PASS 2: Update entries that have references with resolved reference fields
 * 5. Field transformation based on content type definitions
 *
 * The two-pass approach allows:
 * - Contentful to generate all entry IDs (no pre-generated UUIDs)
 * - Support for circular references (A -> B -> C -> A)
 * - tempIds remain ephemeral (only used during creation process)
 *
 * Assets are created from the agent's output array, not parsed algorithmically from RichText fields.
 * The AI agent identifies all images/drawings in the document and returns them in the assets array.
 *
 * @param sdk - Contentful SDK instance (PageAppSDK or ConfigAppSDK)
 * @param entries - Array of entries from Document Parser Agent output
 * @param contentTypeIds - Array of content type IDs to fetch and use
 * @param assets - Array of assets from Document Parser Agent output (optional, defaults to empty array)
 * @returns Promise resolving to creation results with entries and errors
 */
export async function createEntriesFromPreview(
  sdk: PageAppSDK | ConfigAppSDK,
  entries: EntryToCreate[],
  contentTypeIds: string[],
  assets: AssetToCreate[] = []
): Promise<EntryCreationResult> {
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;
  const cma = sdk.cma;
  const defaultLocale = sdk.locales.default;

  // Fetch content types
  const contentTypesResponse = await cma.contentType.getMany({
    spaceId,
    environmentId,
  });
  const contentTypes = contentTypesResponse.items.filter((ct) =>
    contentTypeIds.includes(ct.sys.id)
  );

  if (contentTypes.length === 0) {
    return {
      createdEntries: [],
      errors: [
        {
          contentTypeId: 'validation',
          error: 'No matching content types found',
        },
      ],
    };
  }

  // Map to track tempId -> actual Contentful entry ID (built during Pass 1)
  const tempIdToEntryId = new Map<string, string>();

  // Track created entries and their original entry data (for Pass 2)
  const createdEntriesMap = new Map<string, { created: EntryProps; original: EntryToCreate }>();

  const createdEntries: EntryProps[] = [];
  const errors: Array<{ contentTypeId: string; error: string; details?: any }> = [];

  // ASSET CREATION: Create all assets from agent output first
  const urlToAssetId = await createAssetsFromAgentOutput(
    cma,
    spaceId,
    environmentId,
    defaultLocale,
    assets
  );

  // PASS 1: Create all entries WITHOUT reference fields

  const assetMapForTransform = Object.keys(urlToAssetId).length > 0 ? urlToAssetId : undefined;

  for (const entry of entries) {
    try {
      const contentType = contentTypes.find((ct) => ct.sys.id === entry.contentTypeId);
      // Separate reference fields from non-reference fields
      const { nonRefFields } = separateReferenceFields(entry.fields);
      // Transform fields for content type (handles RichText conversion)
      // Assets are already created and mapped in urlToAssetId
      const transformedFields = await transformFieldsForContentType(
        nonRefFields,
        contentType,
        assetMapForTransform
      );

      // Create the entry in Contentful (let Contentful generate the ID)
      const createdEntry = await cma.entry.create(
        { spaceId, environmentId, contentTypeId: entry.contentTypeId },
        { fields: transformedFields }
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
      errors.push({
        contentTypeId: entry.contentTypeId,
        error: errorMessage,
        details: error,
      });
    }
  }

  // PASS 2: Update entries that have reference fields
  for (const [entryId, { created, original }] of createdEntriesMap) {
    // Skip entries without references
    if (!entryHasReferences(original)) {
      continue;
    }

    try {
      const contentType = contentTypes.find((ct) => ct.sys.id === original.contentTypeId);

      // Extract only the reference fields
      const { refFields } = separateReferenceFields(original.fields);

      // Resolve references (now all IDs are known)
      const resolvedRefFields = resolveReferences(refFields, tempIdToEntryId);

      // Transform fields for content type
      const transformedRefFields = await transformFieldsForContentType(
        resolvedRefFields,
        contentType,
        assetMapForTransform
      );

      // Merge with existing fields and update the entry
      // Need to fetch the latest version to avoid version conflicts
      const latestEntry = await cma.entry.get({ spaceId, environmentId, entryId });

      const updatedFields = {
        ...latestEntry.fields,
        ...transformedRefFields,
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
      errors.push({
        contentTypeId: original.contentTypeId,
        error: `Failed to add references: ${errorMessage}`,
        details: error,
      });
    }
  }

  return { createdEntries, errors };
}
