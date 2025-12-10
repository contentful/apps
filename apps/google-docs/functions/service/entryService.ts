import { PlainClientAPI, EntryProps, ContentTypeProps } from 'contentful-management';
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

    // Log each image token found for debugging
    console.log(`Found image token: alt="${altText}", url=${url.substring(0, 100)}...`);

    // Extract file extension and determine content type from URL
    let fileExtension = 'jpg';
    let contentType = 'image/jpeg';

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();

      // Check for common image extensions
      if (pathname.endsWith('.png')) {
        fileExtension = 'png';
        contentType = 'image/png';
      } else if (pathname.endsWith('.gif')) {
        fileExtension = 'gif';
        contentType = 'image/gif';
      } else if (pathname.endsWith('.webp')) {
        fileExtension = 'webp';
        contentType = 'image/webp';
      } else if (pathname.endsWith('.svg')) {
        fileExtension = 'svg';
        contentType = 'image/svg+xml';
      } else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
        fileExtension = 'jpg';
        contentType = 'image/jpeg';
      } else if (pathname.endsWith('.bmp')) {
        fileExtension = 'bmp';
        contentType = 'image/bmp';
      } else if (pathname.endsWith('.tiff') || pathname.endsWith('.tif')) {
        fileExtension = 'tiff';
        contentType = 'image/tiff';
      }
      // Video formats
      else if (pathname.endsWith('.mp4')) {
        fileExtension = 'mp4';
        contentType = 'video/mp4';
      } else if (pathname.endsWith('.webm')) {
        fileExtension = 'webm';
        contentType = 'video/webm';
      } else if (pathname.endsWith('.mov')) {
        fileExtension = 'mov';
        contentType = 'video/quicktime';
      } else if (pathname.endsWith('.avi')) {
        fileExtension = 'avi';
        contentType = 'video/x-msvideo';
      } else if (pathname.endsWith('.mkv')) {
        fileExtension = 'mkv';
        contentType = 'video/x-matroska';
      }
      // Audio formats
      else if (pathname.endsWith('.mp3')) {
        fileExtension = 'mp3';
        contentType = 'audio/mpeg';
      } else if (pathname.endsWith('.wav')) {
        fileExtension = 'wav';
        contentType = 'audio/wav';
      } else if (pathname.endsWith('.ogg')) {
        fileExtension = 'ogg';
        contentType = 'audio/ogg';
      } else if (pathname.endsWith('.m4a')) {
        fileExtension = 'm4a';
        contentType = 'audio/mp4';
      }
      // Document formats
      else if (pathname.endsWith('.pdf')) {
        fileExtension = 'pdf';
        contentType = 'application/pdf';
      }

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
    } catch (e) {
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
  try {
    new URL(trimmedUrl);
  } catch (e) {
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
  if (!spaceId || typeof spaceId !== 'string' || spaceId.trim().length === 0) {
    throw new Error('spaceId is required and must be a non-empty string');
  }
  if (!environmentId || typeof environmentId !== 'string' || environmentId.trim().length === 0) {
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
  cma.asset.processForAllLocales({ spaceId, environmentId }, asset).catch((err) => {
    console.warn('Background asset processing failed (non-blocking):', {
      assetId: asset.sys.id,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  // Trigger publishing in the background (don't wait for it)
  // Note: Publishing will happen after processing completes
  setTimeout(() => {
    cma.asset.publish({ spaceId, environmentId, assetId: asset.sys.id }, asset).catch((err) => {
      console.warn('Background asset publishing failed (non-blocking):', {
        assetId: asset.sys.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, 1000); // Small delay to allow processing to start

  return asset;
}

async function createAndPublishDevAssetFromUrl(
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
  if (!spaceId || typeof spaceId !== 'string' || spaceId.trim().length === 0) {
    throw new Error('spaceId is required and must be a non-empty string');
  }
  if (!environmentId || typeof environmentId !== 'string' || environmentId.trim().length === 0) {
    throw new Error('environmentId is required and must be a non-empty string');
  }

  const validatedUrl = validateAssetUrl(url);

  // Use metadata if provided, otherwise extract from URL
  const fileName = metadata?.fileName || 'dev-image.jpg';
  const contentType = metadata?.contentType || 'image/jpeg';
  const title = metadata?.title || metadata?.altText || 'Dev Image';

  console.log('Creating dev asset from URL:', validatedUrl, { fileName, contentType, title });

  // Retry asset creation with exponential backoff
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

  // Best-effort process + publish; if it fails, return draft asset
  try {
    const processed = await retryWithBackoff(
      () => cma.asset.processForAllLocales({ spaceId, environmentId }, asset),
      DEFAULT_RETRY_CONFIG,
      'Asset processing'
    );
    // Poll briefly until the file URL exists or timeout (~2s)
    const start = Date.now();
    let current = processed;
    let attempt = 0;
    while (Date.now() - start < 2000) {
      try {
        const fetched = await cma.asset.get({
          spaceId,
          environmentId,
          assetId: current.sys.id,
        });
        const file = (fetched.fields?.file as any)?.['en-US'];
        if (file && (file.url || file.uploadFrom || file.upload)) {
          current = fetched;
          break;
        }
      } catch (err) {
        // Best-effort: log and retry
        console.warn('Polling asset for file URL failed; will retry', {
          assetId: current.sys.id,
          attempt,
          error:
            err instanceof Error
              ? err.message
              : typeof err === 'string'
              ? err
              : JSON.stringify(err),
        });
      }
      attempt += 1;
      await new Promise((r) => setTimeout(r, 200));
    }
    try {
      const published = await retryWithBackoff(
        () => cma.asset.publish({ spaceId, environmentId, assetId: current.sys.id }, current),
        DEFAULT_RETRY_CONFIG,
        'Asset publishing'
      );
      return published;
    } catch (err) {
      console.error('Asset publish failed; returning processed (unpublished) asset', {
        assetId: current.sys.id,
        error:
          err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err),
      });
      return current;
    }
  } catch (err) {
    console.error('Asset processing failed; returning original draft asset', {
      error:
        err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err),
    });
    return asset;
  }
}

// (No block-embed fallback; images are inserted inline where tokens occur)

/**
 * Validates and transforms a field value according to Contentful field validation rules
 * @param value - The field value to validate
 * @param fieldDef - The field definition from Contentful
 * @returns The validated and potentially transformed value, or null if value cannot be made valid
 */
function validateAndTransformFieldValue(
  value: unknown,
  fieldDef: ContentTypeProps['fields'][0]
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Get validation rules for this field
  const validations = fieldDef.validations || [];

  // Handle character count validation for text fields (Symbol, Text)
  if (fieldDef.type === 'Symbol' || fieldDef.type === 'Text') {
    if (typeof value === 'string') {
      let validatedValue = value;
      let wasModified = false;

      // Check for size validation (character count limits)
      for (const validation of validations) {
        if (validation.size) {
          const { min, max } = validation.size;

          if (min !== undefined && validatedValue.length < min) {
            // Value is too short
            // Strategy: If the value is close to min (within 20%), pad with spaces
            // Otherwise, try to extend by repeating the last word or phrase
            // If it's way too short, we'll leave it and let Contentful reject it
            const shortfall = min - validatedValue.length;
            const percentShort = (shortfall / min) * 100;

            if (percentShort <= 20 && validatedValue.trim().length > 0) {
              // Close to minimum - pad with spaces at the end
              validatedValue = validatedValue.padEnd(min, ' ');
              wasModified = true;
              console.warn(
                `Field "${fieldDef.id}" value was padded from ${
                  value.length
                } to ${min} characters (min). Original: "${value.substring(0, 50)}${
                  value.length > 50 ? '...' : ''
                }"`
              );
            } else if (validatedValue.trim().length > 0) {
              // Too short - try to extend intelligently
              // Repeat the last sentence or phrase to reach minimum
              const trimmed = validatedValue.trim();
              const words = trimmed.split(/\s+/);
              if (words.length > 0) {
                // Repeat the last few words to reach minimum
                const lastPhrase = words.slice(-3).join(' ');
                while (validatedValue.length < min && lastPhrase.length > 0) {
                  validatedValue = (validatedValue + ' ' + lastPhrase).substring(0, min);
                }
                wasModified = true;
                console.warn(
                  `Field "${fieldDef.id}" value was extended from ${value.length} to ${
                    validatedValue.length
                  } characters (min: ${min}). Extended value: "${validatedValue.substring(0, 50)}${
                    validatedValue.length > 50 ? '...' : ''
                  }"`
                );
              } else {
                console.warn(
                  `Field "${fieldDef.id}" value is too short: ${
                    validatedValue.length
                  } < ${min} (min). Value: "${validatedValue.substring(0, 50)}${
                    validatedValue.length > 50 ? '...' : ''
                  }"`
                );
              }
            } else {
              // Empty or whitespace-only value
              console.warn(
                `Field "${fieldDef.id}" value is too short or empty: ${validatedValue.length} < ${min} (min). Cannot auto-fix empty values.`
              );
            }
          }

          if (max !== undefined && validatedValue.length > max) {
            // Value is too long - truncate intelligently (at word boundary if possible)
            const originalLength = validatedValue.length;
            if (validatedValue.length > max) {
              // Try to truncate at a word boundary
              let truncated = validatedValue.substring(0, max);
              const lastSpace = truncated.lastIndexOf(' ');
              if (lastSpace > max * 0.8) {
                // If the last space is reasonably close to max, truncate there
                truncated = truncated.substring(0, lastSpace);
              }
              validatedValue = truncated;
              wasModified = true;
              console.warn(
                `Field "${fieldDef.id}" value was truncated from ${originalLength} to ${
                  validatedValue.length
                } characters (max: ${max}). Truncated value: "${validatedValue.substring(0, 50)}${
                  validatedValue.length > 50 ? '...' : ''
                }"`
              );
            }
          }
        }
      }

      return validatedValue;
    }
  }

  // Handle number validation
  if (fieldDef.type === 'Number' || fieldDef.type === 'Integer') {
    if (typeof value === 'number') {
      let validatedValue = value;

      for (const validation of validations) {
        if (validation.range) {
          const { min, max } = validation.range;

          if (min !== undefined && validatedValue < min) {
            validatedValue = min;
            console.warn(`Field "${fieldDef.id}" value ${value} was adjusted to minimum ${min}`);
          }

          if (max !== undefined && validatedValue > max) {
            validatedValue = max;
            console.warn(`Field "${fieldDef.id}" value ${value} was adjusted to maximum ${max}`);
          }
        }
      }

      return validatedValue;
    }
  }

  // For other field types, return as-is
  return value;
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
        perLocale[locale] = validateAndTransformFieldValue(value, def);
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
function validateCreateEntriesInput(
  cma: PlainClientAPI | null | undefined,
  entries: EntryToCreate[] | null | undefined,
  config:
    | { spaceId: string; environmentId: string; contentTypes: ContentTypeProps[] }
    | null
    | undefined
): void {
  if (!cma) {
    throw new Error('CMA client is required and cannot be null or undefined');
  }

  if (!entries) {
    throw new Error('Entries array is required and cannot be null or undefined');
  }

  if (!Array.isArray(entries)) {
    throw new Error('Entries must be an array');
  }

  if (entries.length === 0) {
    throw new Error('Entries array cannot be empty');
  }

  if (!config) {
    throw new Error('Config is required and cannot be null or undefined');
  }

  const { spaceId, environmentId, contentTypes } = config;

  if (!spaceId || typeof spaceId !== 'string' || spaceId.trim().length === 0) {
    throw new Error('spaceId is required and must be a non-empty string');
  }

  if (!environmentId || typeof environmentId !== 'string' || environmentId.trim().length === 0) {
    throw new Error('environmentId is required and must be a non-empty string');
  }

  if (!contentTypes) {
    throw new Error('contentTypes is required and cannot be null or undefined');
  }

  if (!Array.isArray(contentTypes)) {
    throw new Error('contentTypes must be an array');
  }

  // Validate each entry structure
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) {
      throw new Error(`Entry at index ${i} is null or undefined`);
    }

    if (typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Entry at index ${i} must be an object`);
    }

    if (
      !entry.contentTypeId ||
      typeof entry.contentTypeId !== 'string' ||
      entry.contentTypeId.trim().length === 0
    ) {
      throw new Error(`Entry at index ${i} must have a valid contentTypeId (non-empty string)`);
    }

    if (!entry.fields) {
      throw new Error(`Entry at index ${i} must have a fields property`);
    }

    if (typeof entry.fields !== 'object' || Array.isArray(entry.fields)) {
      throw new Error(`Entry at index ${i} fields must be an object`);
    }

    // Validate fields structure: should be { fieldId: { locale: value } }
    for (const [fieldId, localizedValue] of Object.entries(entry.fields)) {
      if (!fieldId || typeof fieldId !== 'string') {
        throw new Error(`Entry at index ${i} has invalid field ID: ${fieldId}`);
      }

      if (!localizedValue || typeof localizedValue !== 'object' || Array.isArray(localizedValue)) {
        throw new Error(
          `Entry at index ${i}, field "${fieldId}" must be an object with locale keys`
        );
      }

      // Check that localizedValue has at least one locale
      const localeKeys = Object.keys(localizedValue);
      if (localeKeys.length === 0) {
        throw new Error(`Entry at index ${i}, field "${fieldId}" must have at least one locale`);
      }

      // Validate locale keys and values
      for (const [locale, value] of Object.entries(localizedValue)) {
        if (!locale || typeof locale !== 'string') {
          throw new Error(`Entry at index ${i}, field "${fieldId}" has invalid locale: ${locale}`);
        }

        // Value can be various types, but not null (undefined is allowed to skip fields)
        if (value === null) {
          throw new Error(
            `Entry at index ${i}, field "${fieldId}", locale "${locale}" has null value (use undefined to skip)`
          );
        }
      }
    }
  }
}

/**
 * Creates multiple entries in Contentful
 *
 * @param cma - Contentful Management API client
 * @param entries - Array of entries from Document Parser Agent output
 * @param config - Space and environment configuration
 * @returns Promise resolving to creation results with entries and errors
 */
export async function createEntries(
  cma: PlainClientAPI,
  entries: EntryToCreate[],
  config: { spaceId: string; environmentId: string; contentTypes: ContentTypeProps[] }
): Promise<EntryCreationResult> {
  // Validate all inputs before processing
  try {
    validateCreateEntriesInput(cma, entries, config);
  } catch (validationError) {
    const errorMessage =
      validationError instanceof Error ? validationError.message : String(validationError);
    console.error('Input validation failed:', errorMessage);
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

  // Create entries sequentially to avoid rate limiting issues
  // In production, you may want to implement batching and retry logic
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      const contentType = contentTypes.find((ct) => ct.sys.id === entry.contentTypeId);
      // Build URL->assetId map: extract metadata and create assets
      let urlToAssetId: Record<string, string> | undefined;
      if (contentType) {
        // Extract all image metadata from RichText fields
        // Track both URL and alt text to handle cases where same URL appears with different alt text
        // Use tokenKey (URL::alt) as the key to ensure each unique token gets its own asset
        const imageTokenMap = new Map<string, ImageMetadata>();

        for (const field of contentType.fields) {
          if (field.type !== 'RichText') continue;
          const originalLocalized = entry.fields[field.id];
          if (!originalLocalized) continue;
          for (const originalVal of Object.values(originalLocalized)) {
            if (typeof originalVal !== 'string') continue;
            const metadata = extractImageMetadata(originalVal);
            for (const meta of metadata) {
              // Use normalized URL as base
              const normalizedUrl = meta.url.replace(/\s+/g, '');
              // Create a unique key combining URL and alt text to handle duplicates
              // This ensures drawings with same URL as images get separate assets
              const tokenKey = `${normalizedUrl}::${meta.altText || 'image'}`;

              // If we haven't seen this exact token (URL + alt) before, add it
              if (!imageTokenMap.has(tokenKey)) {
                imageTokenMap.set(tokenKey, meta);
              }
            }
          }
        }

        // Create assets for unique images - one asset per unique token (URL + alt)
        if (imageTokenMap.size > 0) {
          urlToAssetId = {};

          // Create a separate asset for each unique image token
          // Use composite keys (URL + alt) to handle cases where same URL appears with different alt text
          // OPTIMIZATION: Create assets in parallel and without waiting for processing/publishing
          // This prevents timeouts when processing many images
          console.log(
            `Processing ${imageTokenMap.size} unique image tokens for asset creation (parallel, fast mode)`
          );

          // Prepare all asset creation promises
          const assetCreationPromises = Array.from(imageTokenMap.entries()).map(
            async ([tokenKey, metadata]) => {
              let imageUrl: string;
              try {
                const parsed = new URL(metadata.url);
                const host = parsed.hostname;

                // Use the actual URL - Contentful will try to fetch it
                // If it fails, Contentful will handle the error gracefully
                // For googleusercontent.com URLs, they may require authentication, but we'll try anyway
                imageUrl = metadata.url;

                console.log(`Creating asset for image token: ${imageUrl.substring(0, 100)}...`, {
                  fileName: metadata.fileName,
                  contentType: metadata.contentType,
                  host,
                  altText: metadata.altText,
                  tokenKey: tokenKey.substring(0, 100),
                  isDrawing: metadata.altText.toLowerCase().includes('drawing'),
                });
              } catch (e) {
                // If URL parsing fails, don't trust the URL, use the dev image
                console.warn(
                  'Invalid URL format, using placeholder:',
                  metadata.url.substring(0, 100)
                );
                imageUrl = 'https://placehold.co/800x400?text=Dev+Image';
              }

              try {
                // Use fast asset creation (no waiting for processing/publishing)
                const asset = await createAssetFromUrlFast(cma, spaceId, environmentId, imageUrl, {
                  title: metadata.altText || metadata.fileName || 'Image',
                  altText: metadata.altText,
                  fileName: metadata.fileName,
                  contentType: metadata.contentType,
                });

                // Return mapping info for later processing
                const normalizedUrl = metadata.url.replace(/\s+/g, '');
                return {
                  tokenKey,
                  normalizedUrl,
                  metadata,
                  assetId: asset.sys.id,
                };
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(
                  `✗ Failed to create asset for token ${tokenKey.substring(0, 100)}...:`,
                  errorMessage
                );
                // Return null to indicate failure
                return null;
              }
            }
          );

          // Wait for all assets to be created in parallel
          const results = await Promise.all(assetCreationPromises);

          // Build the urlToAssetId mapping from results
          // Track which URLs we've seen to handle duplicates correctly
          const seenUrls = new Set<string>();

          for (const result of results) {
            if (!result) continue; // Skip failed asset creations

            const { tokenKey, normalizedUrl, metadata, assetId } = result;

            // 1. Always map the tokenKey (URL::alt) - this is the primary lookup key
            urlToAssetId[tokenKey] = assetId;

            // 2. Also map the normalized URL (without alt) for backward compatibility
            // IMPORTANT: Only map plain URL if it's the FIRST occurrence of that URL
            // This prevents later images from overwriting earlier ones (fixes first image issue)
            // If the same URL appears multiple times with different alt text, we rely on composite keys
            if (!seenUrls.has(normalizedUrl)) {
              urlToAssetId[normalizedUrl] = assetId;
              seenUrls.add(normalizedUrl);
            } else {
              // URL already mapped - log a warning but don't overwrite
              // The composite key mapping above will handle the lookup correctly
              console.warn(
                `Duplicate URL detected (already mapped to ${
                  urlToAssetId[normalizedUrl]
                }): ${normalizedUrl.substring(0, 80)}... (new alt: "${metadata.altText}")`
              );
            }

            // 3. Also create composite key for lookup: URL::alt (same as tokenKey, but explicit)
            const compositeKey = `${normalizedUrl}::${metadata.altText || 'image'}`;
            urlToAssetId[compositeKey] = assetId;

            // 4. If it's a drawing, also create the drawing-specific key
            if (metadata.altText.toLowerCase().includes('drawing')) {
              urlToAssetId[`${normalizedUrl}::drawing`] = assetId;
            }

            console.log(`✓ Created asset ${assetId} for token: ${tokenKey.substring(0, 100)}...`, {
              altText: metadata.altText,
              fileName: metadata.fileName,
              originalUrl: metadata.url.substring(0, 100),
              normalizedUrl: normalizedUrl.substring(0, 100),
            });
          }

          const successCount = results.filter((r): r is NonNullable<typeof r> => r !== null).length;
          console.log(
            `Created ${successCount}/${imageTokenMap.size} assets (${
              Object.keys(urlToAssetId).length
            } mappings)`
          );
          if (urlToAssetId) {
            console.log(
              `URL to Asset ID mapping:`,
              Object.entries(urlToAssetId)
                .slice(0, 5)
                .map(([url, id]) => ({
                  key: url.substring(0, 80) + '...',
                  assetId: id,
                }))
            );
          }
        }
      }
      const transformedFields = transformFieldsForContentType(
        entry.fields,
        contentType,
        urlToAssetId
      );

      // No block-embed fallback; images are inserted inline via markdown tokens.

      const createdEntry = await cma.entry.create(
        { spaceId, environmentId, contentTypeId: entry.contentTypeId },
        {
          fields: transformedFields,
        }
      );

      // Optionally publish the entry immediately
      // const publishedEntry = await cma.entry.publish(
      //   { spaceId, environmentId, entryId: createdEntry.sys.id },
      //   createdEntry
      // );

      createdEntries.push(createdEntry);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to create entry of type ${entry.contentTypeId}:`, error);
      errors.push({
        contentTypeId: entry.contentTypeId,
        error: errorMessage,
        details: error,
      });
    }
  }

  return { createdEntries, errors };
}
