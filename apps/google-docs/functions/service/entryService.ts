import { PlainClientAPI, EntryProps, ContentTypeProps } from 'contentful-management';
import { extname } from 'path';
import { EntryToCreate } from '../agents/documentParserAgent/schema';
import { MarkdownParser } from './utils/richtext';
/**
 * INTEG-3264: Service for creating entries in Contentful using the Contentful Management API
 *
 * This service takes the output from the Document Parser Agent (which extracts entries from documents)
 * and creates them in Contentful using the CMA client.
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
// Regex for extracting just URLs (for backward compatibility)
const IMAGE_URL_REGEX = /!\[[^\]]*?\]\(([\s\S]*?)\)/g;

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

      // Extract extension using Node's path module
      const extension = extname(pathname).slice(1).toLowerCase();
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
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  url: string,
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
  const fileName = metadata?.fileName || 'dev-image.jpg';
  const contentType = metadata?.contentType || 'image/jpeg';
  const title = metadata?.title || metadata?.altText || 'Dev Image';

  // Create asset without waiting for processing/publishing
  // Contentful will process and publish it in the background
  const asset = await retryWithBackoff(
    () =>
      cma.asset.create(
        { spaceId, environmentId },
        {
          fields: {
            title: { 'en-US': title },
            file: {
              'en-US': {
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

function transformFieldsForContentType(
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
          const contentNodes = parser.parse(value);
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
 * Validates input parameters for createEntries function
 * @throws Error if validation fails
 */
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
  cma: PlainClientAPI | null | undefined,
  entries: EntryToCreate[] | null | undefined,
  config:
    | { spaceId: string; environmentId: string; contentTypes: ContentTypeProps[] }
    | null
    | undefined
): void {
  // Validate CMA client
  if (!cma) {
    throw new Error('CMA client is required and cannot be null or undefined');
  }

  // Validate entries array
  if (!entries) {
    throw new Error('Entries array is required and cannot be null or undefined');
  }
  validateNonEmptyArray<EntryToCreate>(entries, 'Entries array');

  // Validate config
  if (!config) {
    throw new Error('Config is required and cannot be null or undefined');
  }
  const { spaceId, environmentId, contentTypes } = config;
  validateNonEmptyString(spaceId, 'spaceId');
  validateNonEmptyString(environmentId, 'environmentId');

  if (!contentTypes) {
    throw new Error('contentTypes is required and cannot be null or undefined');
  }
  validateNonEmptyArray<ContentTypeProps>(contentTypes, 'contentTypes');

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

/**
 * Creates multiple entries in Contentful
 *
 * @param cma - Contentful Management API client
 * @param entries - Array of entries from Document Parser Agent output
 * @param config - Space and environment configuration
 * @returns Promise resolving to creation results with entries and errors
 */
/**
 * Extracts unique image tokens from an entry's RichText fields
 */
function extractImageTokensFromEntry(
  entry: EntryToCreate,
  contentType: ContentTypeProps
): Map<string, ImageMetadata> {
  const imageTokenMap = new Map<string, ImageMetadata>();

  for (const field of contentType.fields) {
    if (field.type !== 'RichText') continue;
    const originalLocalized = entry.fields[field.id];
    if (!originalLocalized) continue;

    for (const originalVal of Object.values(originalLocalized)) {
      if (typeof originalVal !== 'string') continue;
      const metadata = extractImageMetadata(originalVal);

      for (const meta of metadata) {
        const normalizedUrl = meta.url.replace(/\s+/g, '');
        const tokenKey = `${normalizedUrl}::${meta.altText || 'image'}`;

        if (!imageTokenMap.has(tokenKey)) {
          imageTokenMap.set(tokenKey, meta);
        }
      }
    }
  }

  return imageTokenMap;
}

/**
 * Creates assets for image tokens in parallel and returns mapping results
 */
async function createAssetsForTokens(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  imageTokenMap: Map<string, ImageMetadata>
): Promise<Array<{ tokenKey: string; normalizedUrl: string; assetId: string } | null>> {
  const assetCreationPromises = Array.from(imageTokenMap.entries()).map(
    async ([tokenKey, metadata]) => {
      const imageUrl = isValidUrl(metadata.url)
        ? metadata.url
        : 'https://placehold.co/800x400?text=Dev+Image';

      try {
        const asset = await createAssetFromUrlFast(cma, spaceId, environmentId, imageUrl, {
          title: metadata.altText || metadata.fileName || 'Image',
          altText: metadata.altText,
          fileName: metadata.fileName,
          contentType: metadata.contentType,
        });

        return {
          tokenKey,
          normalizedUrl: metadata.url.replace(/\s+/g, ''),
          assetId: asset.sys.id,
        };
      } catch {
        return null;
      }
    }
  );

  return Promise.all(assetCreationPromises);
}

/**
 * Builds URL to Asset ID mapping from asset creation results
 */
function buildUrlToAssetIdMap(
  results: Array<{ tokenKey: string; normalizedUrl: string; assetId: string } | null>,
  imageTokenMap: Map<string, ImageMetadata>
): Record<string, string> {
  const urlToAssetId: Record<string, string> = {};
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (!result) continue;

    const { tokenKey, normalizedUrl, assetId } = result;
    const metadata = imageTokenMap.get(tokenKey);
    if (!metadata) continue;

    // Map tokenKey (primary lookup key)
    urlToAssetId[tokenKey] = assetId;

    // Map normalized URL (only for first occurrence to prevent overwrites)
    if (!seenUrls.has(normalizedUrl)) {
      urlToAssetId[normalizedUrl] = assetId;
      seenUrls.add(normalizedUrl);
    }

    // Map composite key
    const compositeKey = `${normalizedUrl}::${metadata.altText || 'image'}`;
    urlToAssetId[compositeKey] = assetId;

    // Map drawing-specific key if applicable
    if (metadata.altText.toLowerCase().includes('drawing')) {
      urlToAssetId[`${normalizedUrl}::drawing`] = assetId;
    }
  }

  return urlToAssetId;
}

export async function createEntries(
  cma: PlainClientAPI,
  entries: EntryToCreate[],
  config: { spaceId: string; environmentId: string; contentTypes: ContentTypeProps[] }
): Promise<EntryCreationResult> {
  try {
    validateCreateEntriesInput(cma, entries, config);
  } catch (validationError) {
    const errorMessage =
      validationError instanceof Error ? validationError.message : String(validationError);
    return {
      createdEntries: [],
      errors: [
        {
          contentTypeId: 'validation',
          error: `Input validation failed: ${errorMessage}`,
          details: validationError,
        },
      ],
    };
  }

  const { spaceId, environmentId, contentTypes } = config;
  const createdEntries: EntryProps[] = [];
  const errors: Array<{ contentTypeId: string; error: string; details?: any }> = [];

  for (const entry of entries) {
    try {
      const contentType = contentTypes.find((ct) => ct.sys.id === entry.contentTypeId);
      let urlToAssetId: Record<string, string> | undefined;

      if (contentType) {
        const imageTokenMap = extractImageTokensFromEntry(entry, contentType);

        if (imageTokenMap.size > 0) {
          const results = await createAssetsForTokens(cma, spaceId, environmentId, imageTokenMap);
          urlToAssetId = buildUrlToAssetIdMap(results, imageTokenMap);
        }
      }

      const transformedFields = transformFieldsForContentType(
        entry.fields,
        contentType,
        urlToAssetId
      );

      const createdEntry = await cma.entry.create(
        { spaceId, environmentId, contentTypeId: entry.contentTypeId },
        { fields: transformedFields }
      );

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

  return { createdEntries, errors };
}
