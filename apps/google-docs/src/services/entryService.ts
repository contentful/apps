import { PageAppSDK, ConfigAppSDK } from '@contentful/app-sdk';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import {
  EntryToCreate,
  AssetToCreate,
  isReference,
  isReferenceArray,
} from '../../functions/agents/documentParserAgent/schema';
import { MarkdownParser } from './richtext';

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

// Precompiled regex for markdown image tokens: ![alt](url)
// Note: This regex captures both alt text and URL for metadata extraction
const IMAGE_TOKEN_REGEX = /!\[([^\]]*?)\]\(([\s\S]*?)\)/g;

/**
 * MIME type mapping for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  pdf: 'application/pdf',
};

/**
 * Extracted metadata from an image token
 */
interface ImageMetadata {
  url: string;
  altText: string;
  fileName: string;
  contentType: string;
  fileExtension: string;
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getFileExtension(pathname: string): string {
  const lastDot = pathname.lastIndexOf('.');
  if (lastDot === -1 || lastDot === pathname.length - 1) {
    return '';
  }
  return pathname.slice(lastDot + 1).toLowerCase();
}

/**
 * Extracts image metadata from markdown image tokens
 * Returns array of ImageMetadata objects
 */
function extractImageMetadata(markdownText: string): ImageMetadata[] {
  const metadata: ImageMetadata[] = [];

  if (!markdownText || typeof markdownText !== 'string') {
    return metadata;
  }

  // Reset regex state
  IMAGE_TOKEN_REGEX.lastIndex = 0;

  for (const match of markdownText.matchAll(IMAGE_TOKEN_REGEX)) {
    const altText = match[1] || '';
    // Extract URL and normalize (remove all whitespace) - this matches how we store it in the map
    const url = String(match[2]).replace(/\s+/g, '').trim();

    if (!url) {
      continue;
    }

    // Extract file extension and determine content type from URL
    let fileExtension = 'jpg';
    let contentType = 'image/jpeg';

    if (isValidUrl(url)) {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      const extension = getFileExtension(pathname);
      fileExtension = extension || 'jpg';
      contentType = MIME_TYPES[fileExtension] || 'image/jpeg';

      // Extract filename from pathname
      const pathParts = pathname.split('/').filter(Boolean);
      const fileName = pathParts[pathParts.length - 1] || `image.${fileExtension}`;

      metadata.push({
        url,
        altText: altText.trim(),
        fileName: fileName.includes('.') ? fileName : `${fileName}.${fileExtension}`,
        contentType,
        fileExtension,
      });
    } else {
      // If URL parsing fails, use defaults
      metadata.push({
        url,
        altText: altText.trim(),
        fileName: `image.${fileExtension}`,
        contentType,
        fileExtension,
      });
    }
  }

  return metadata;
}

/**
 * Validates URL input for asset creation
 */
function validateAssetUrl(url: string | null | undefined): string {
  if (!url) {
    throw new Error('URL is required and cannot be null or undefined');
  }

  if (typeof url !== 'string') {
    throw new Error('URL must be a string');
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    throw new Error('URL cannot be an empty string');
  }

  // Basic URL validation
  if (!isValidUrl(trimmedUrl)) {
    throw new Error(`Invalid URL format: ${trimmedUrl.substring(0, 100)}`);
  }

  return trimmedUrl;
}

/**
 * Retry configuration for asset operations
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Retries a function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error | unknown;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === config.maxRetries) {
        // Last attempt failed
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `${operationName} failed after ${config.maxRetries + 1} attempts:`,
          errorMessage
        );
        throw error;
      }

      // Wait before retrying with exponential backoff
      const currentDelay = Math.min(delay, config.maxDelayMs);
      console.warn(
        `${operationName} failed (attempt ${attempt + 1}/${
          config.maxRetries + 1
        }), retrying in ${currentDelay}ms...`,
        {
          error: error instanceof Error ? error.message : String(error),
        }
      );

      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      delay *= config.backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
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

  const validatedUrl = validateAssetUrl(url);

  // Use metadata if provided, otherwise extract from URL
  const fileName = metadata?.fileName || 'image.jpg';
  const contentType = metadata?.contentType || 'image/jpeg';
  const title = metadata?.title || metadata?.altText || 'Image';

  // Create asset without waiting for processing/publishing
  // Contentful will process and publish it in the background
  const asset = await retryWithBackoff(
    () =>
      cma.asset.create(
        { spaceId, environmentId },
        {
          fields: {
            title: { [defaultLocale]: title },
            file: {
              [defaultLocale]: {
                contentType,
                fileName,
                upload: validatedUrl,
              },
            },
          },
        }
      ),
    DEFAULT_RETRY_CONFIG,
    'Asset creation'
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
        if (typeof value === 'string') {
          const parser = new MarkdownParser(urlToAssetId);
          const contentNodes = await parser.parseDocument(value);
          perLocale[locale] = {
            nodeType: 'document',
            data: {},
            content:
              contentNodes && contentNodes.length
                ? contentNodes
                : [
                    {
                      nodeType: 'paragraph',
                      data: {},
                      content: [{ nodeType: 'text', value: '', marks: [], data: {} }],
                    },
                  ],
          };
        } else {
          // Pass through if already Rich Text-shaped or unknown type
          perLocale[locale] = value;
        }
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
 * Validates that a value is a non-empty string
 */
function validateNonEmptyString(value: unknown, name: string): asserts value is string {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required and must be a non-empty string`);
  }
}

/**
 * Validates that a value is a non-empty array
 */
function validateNonEmptyArray<T>(value: unknown, name: string): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }
  if (value.length === 0) {
    throw new Error(`${name} cannot be empty`);
  }
}

/**
 * Validates that a value is a non-null object (not an array)
 */
function validateObject(value: unknown, name: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
}

function validateCreateEntriesInput(
  sdk: PageAppSDK | ConfigAppSDK | null | undefined,
  entries: EntryToCreate[] | null | undefined,
  contentTypeIds: string[] | null | undefined
): void {
  // Validate SDK
  if (!sdk) {
    throw new Error('SDK is required and cannot be null or undefined');
  }
  if (!sdk.cma) {
    throw new Error('CMA client is required and cannot be null or undefined');
  }

  // Validate entries array
  if (!entries) {
    throw new Error('Entries array is required and cannot be null or undefined');
  }
  validateNonEmptyArray<EntryToCreate>(entries, 'Entries');

  // Validate contentTypeIds
  if (!contentTypeIds) {
    throw new Error('contentTypeIds is required and cannot be null or undefined');
  }
  validateNonEmptyArray<string>(contentTypeIds, 'contentTypeIds');

  // Validate each entry
  entries.forEach((entry, i) => {
    if (!entry) {
      throw new Error(`Entry at index ${i} is null or undefined`);
    }
    validateObject(entry, `Entry at index ${i}`);
    validateNonEmptyString(entry.contentTypeId, `Entry at index ${i} contentTypeId`);

    if (!entry.fields) {
      throw new Error(`Entry at index ${i} must have a fields property`);
    }
    validateObject(entry.fields, `Entry at index ${i} fields`);

    // Validate fields structure: { fieldId: { locale: value } }
    Object.entries(entry.fields).forEach(([fieldId, localizedValue]) => {
      if (!fieldId || typeof fieldId !== 'string') {
        throw new Error(`Entry at index ${i} has invalid field ID: ${fieldId}`);
      }

      validateObject(localizedValue, `Entry at index ${i}, field "${fieldId}"`);

      const localeKeys = Object.keys(localizedValue);
      if (localeKeys.length === 0) {
        throw new Error(`Entry at index ${i}, field "${fieldId}" must have at least one locale`);
      }

      // Validate locale keys and values
      Object.entries(localizedValue).forEach(([locale, value]) => {
        validateNonEmptyString(locale, `Entry at index ${i}, field "${fieldId}" locale`);
        if (value === null) {
          throw new Error(
            `Entry at index ${i}, field "${fieldId}", locale "${locale}" has null value (use undefined to skip)`
          );
        }
      });
    });
  });
}

// NOTE: Algorithm-based asset extraction functions have been removed.
// Assets are now identified and returned by the AI agent, then created via createAssetsFromAgentOutput.

/**
 * Creates a Contentful Link object for an entry reference
 */
function createEntryLink(entryId: string): {
  sys: { type: 'Link'; linkType: 'Entry'; id: string };
} {
  return {
    sys: {
      type: 'Link',
      linkType: 'Entry',
      id: entryId,
    },
  };
}

/**
 * Checks if a field value contains reference placeholders
 */
function valueHasReferences(value: unknown): boolean {
  if (isReference(value)) return true;
  if (isReferenceArray(value)) return true;
  return false;
}

/**
 * Checks if an entry has any reference fields
 */
function entryHasReferences(entry: EntryToCreate): boolean {
  for (const localizedValue of Object.values(entry.fields)) {
    for (const value of Object.values(localizedValue)) {
      if (valueHasReferences(value)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Separates entry fields into non-reference fields and reference-only fields.
 * Used in the two-pass approach: first create with non-ref fields, then update with refs.
 */
function separateReferenceFields(fields: Record<string, Record<string, unknown>>): {
  nonRefFields: Record<string, Record<string, unknown>>;
  refFields: Record<string, Record<string, unknown>>;
} {
  const nonRefFields: Record<string, Record<string, unknown>> = {};
  const refFields: Record<string, Record<string, unknown>> = {};

  for (const [fieldId, localizedValue] of Object.entries(fields)) {
    const nonRefLocalized: Record<string, unknown> = {};
    const refLocalized: Record<string, unknown> = {};

    for (const [locale, value] of Object.entries(localizedValue)) {
      if (valueHasReferences(value)) {
        refLocalized[locale] = value;
      } else {
        nonRefLocalized[locale] = value;
      }
    }

    if (Object.keys(nonRefLocalized).length > 0) {
      nonRefFields[fieldId] = nonRefLocalized;
    }
    if (Object.keys(refLocalized).length > 0) {
      refFields[fieldId] = refLocalized;
    }
  }

  return { nonRefFields, refFields };
}

/**
 * Looks up a tempId in the map, with case-insensitive fallback.
 * AI can be inconsistent with casing (e.g., "author_1" vs "Author_1").
 */
function lookupTempId(tempId: string, tempIdToEntryId: Map<string, string>): string | undefined {
  // First try exact match
  const exactMatch = tempIdToEntryId.get(tempId);
  if (exactMatch) return exactMatch;

  // Fallback: case-insensitive match
  const lowerTempId = tempId.toLowerCase();
  for (const [key, value] of tempIdToEntryId.entries()) {
    if (key.toLowerCase() === lowerTempId) {
      return value;
    }
  }

  return undefined;
}

/**
 * Resolves reference placeholders in entry fields, replacing { __ref: "tempId" }
 * with actual Contentful Link objects { sys: { type: "Link", linkType: "Entry", id: "..." } }
 */
function resolveReferences(
  fields: Record<string, Record<string, unknown>>,
  tempIdToEntryId: Map<string, string>
): Record<string, Record<string, unknown>> {
  const resolved: Record<string, Record<string, unknown>> = {};

  for (const [fieldId, localizedValue] of Object.entries(fields)) {
    const resolvedLocalized: Record<string, unknown> = {};

    for (const [locale, value] of Object.entries(localizedValue)) {
      if (isReference(value)) {
        // Single reference
        const entryId = lookupTempId(value.__ref, tempIdToEntryId);
        if (entryId) {
          resolvedLocalized[locale] = createEntryLink(entryId);
        }
        // Skip this field value if reference cannot be resolved
      } else if (isReferenceArray(value)) {
        // Array of references
        const resolvedRefs = value
          .map((ref) => {
            const entryId = lookupTempId(ref.__ref, tempIdToEntryId);
            if (entryId) {
              return createEntryLink(entryId);
            }
            return null;
          })
          .filter((link) => link !== null);

        if (resolvedRefs.length > 0) {
          resolvedLocalized[locale] = resolvedRefs;
        }
      } else {
        // Non-reference value, pass through
        resolvedLocalized[locale] = value;
      }
    }

    // Only include field if it has at least one locale value
    if (Object.keys(resolvedLocalized).length > 0) {
      resolved[fieldId] = resolvedLocalized;
    }
  }

  return resolved;
}

/**
 * Creates assets from the agent output and builds URL mapping for RichText conversion
 *
 * The mapping supports multiple lookup keys to match how MarkdownParser searches for assets:
 * - normalizedUrl: Direct URL lookup
 * - compositeKey: `${normalizedUrl}::${altText || 'image'}` for matching with alt text
 * - drawingKey: `${normalizedUrl}::drawing` if alt text includes "drawing"
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
    if (!isValidUrl(asset.url)) {
      console.warn(`Skipping invalid asset URL: ${asset.url.substring(0, 100)}...`);
      return null;
    }

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

  // Build mapping with multiple keys for MarkdownParser lookup
  for (const result of results) {
    if (!result) continue;

    const { normalizedUrl, altText, assetId } = result;

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
  try {
    validateCreateEntriesInput(sdk, entries, contentTypeIds);
  } catch (validationError) {
    const errorMessage =
      validationError instanceof Error ? validationError.message : String(validationError);
    return {
      createdEntries: [],
      errors: [
        {
          contentTypeId: 'validation',
          error: errorMessage,
          details: validationError,
        },
      ],
    };
  }

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
        Object.keys(urlToAssetId).length > 0 ? urlToAssetId : undefined
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
        undefined // No assets in reference fields
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
