import { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { normalizeAgentRichTextJson } from './richtext';
import { EntryToCreate, AssetToCreate, PreviewPayload } from '@types';
import {
  entryHasReferences,
  separateReferenceFields,
  resolveReferences,
} from './referenceResolution';
import { orderEntriesByCreationOrder } from '../utils/previewPayload';
import { mapFieldValuesToSpaceDefaultLocale } from '../utils/remapEntryLocales';

export interface EntryCreationResult {
  createdEntries: EntryProps[];
  errors: Array<{
    contentTypeId: string;
    error: string;
    details?: any;
  }>;
}

async function createAssetFromUrlFast(
  cma: PageAppSDK['cma'] | ConfigAppSDK['cma'],
  spaceId: string,
  environmentId: string,
  url: string,
  defaultLocale: string,
  metadata?: { title?: string; altText?: string; fileName?: string; contentType?: string }
) {
  const fileName = metadata?.fileName || 'image.jpg';
  const contentType = metadata?.contentType || 'image/jpeg';
  const title = metadata?.title || metadata?.altText || 'Image';

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

  cma.asset.processForAllLocales({ spaceId, environmentId }, asset).catch(() => {
    // Silently fail - processing will be retried by Contentful
  });

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
        perLocale[locale] = value;
      }
    }

    transformed[fieldId] = perLocale;
  }

  return transformed;
}

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

    urlToAssetId[normalizedUrl] = assetId;

    const compositeKey = `${normalizedUrl}::${altText || 'image'}`;
    urlToAssetId[compositeKey] = assetId;

    if (altText.toLowerCase().includes('drawing')) {
      urlToAssetId[`${normalizedUrl}::drawing`] = assetId;
    }
  }

  return urlToAssetId;
}

export async function createEntriesFromPreviewPayload(
  sdk: PageAppSDK | ConfigAppSDK,
  payload: PreviewPayload
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
 * Creates entries in two passes: without reference fields, then patches references
 * (including Rich Text entry links). Assets from `assets` are created first; Rich Text
 * asset placeholders use the resulting id map in both passes.
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

  const contentTypesResponse = await cma.contentType.getMany({
    spaceId,
    environmentId,
    query: { 'sys.id[in]': contentTypeIds.join(',') },
  });
  const contentTypes = contentTypesResponse.items;

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

      const { refFields } = separateReferenceFields(original.fields);

      // Resolve references (now all IDs are known)
      const resolvedRefFields = resolveReferences(refFields, tempIdToEntryId);
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
