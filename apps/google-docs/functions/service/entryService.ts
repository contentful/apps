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
const IMAGE_TOKEN_REGEX = /!\[[^\]]*?\]\(([\s\S]*?)\)/g;

async function createAndPublishDevAssetFromUrl(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  url: string
) {
  const fileName = 'dev-image.jpg';
  const contentType = 'image/jpeg';
  console.log('Creating dev asset from URL:', url);
  const asset = await cma.asset.create(
    { spaceId, environmentId },
    {
      fields: {
        title: { 'en-US': 'Dev Image' },
        file: {
          'en-US': {
            contentType,
            fileName,
            upload: url,
          },
        },
      },
    }
  );
  // Best-effort process + publish; if it fails, return draft asset
  try {
    const processed = await cma.asset.processForAllLocales({ spaceId, environmentId }, asset);
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
      const published = await cma.asset.publish(
        { spaceId, environmentId, assetId: current.sys.id },
        current
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
        perLocale[locale] = value;
      }
    }

    transformed[fieldId] = perLocale;
  }

  return transformed;
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
  const { spaceId, environmentId, contentTypes } = config;
  const createdEntries: EntryProps[] = [];
  const errors: Array<{ contentTypeId: string; error: string; details?: any }> = [];

  // Create entries sequentially to avoid rate limiting issues
  // In production, you may want to implement batching and retry logic
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      const contentType = contentTypes.find((ct) => ct.sys.id === entry.contentTypeId);
      // Build URL->assetId map: normalize URLs and only take the first image token per RichText field
      let urlToAssetId: Record<string, string> | undefined;
      if (contentType) {
        const urls: string[] = [];
        for (const field of contentType.fields) {
          if (field.type !== 'RichText') continue;
          const originalLocalized = entry.fields[field.id];
          if (!originalLocalized) continue;
          for (const originalVal of Object.values(originalLocalized)) {
            if (typeof originalVal !== 'string') continue;
            // Reset regex state before each new string scan
            IMAGE_TOKEN_REGEX.lastIndex = 0;
            for (const match of (originalVal as string).matchAll(IMAGE_TOKEN_REGEX)) {
              const normalizedUrl = String(match[1]).replace(/\s+/g, '');
              urls.push(normalizedUrl);
            }
          }
        }
        const uniqueUrls = Array.from(new Set(urls));
        if (uniqueUrls.length) {
          const firstUrl = uniqueUrls[0];
          // TODO: Remove this once we have a real image with OAuth
          let devUrl: string;
          try {
            const parsed = new URL(firstUrl);
            // Only allow googleusercontent.com and its direct subdomains
            const allowedHost = 'googleusercontent.com';
            const host = parsed.hostname;
            if (host === allowedHost || host.endsWith('.' + allowedHost)) {
              devUrl = 'https://placehold.co/800x400?text=Dev+Image';
            } else {
              devUrl = firstUrl;
            }
          } catch (e) {
            // If URL parsing fails, don't trust the URL, use the dev image
            devUrl = 'https://placehold.co/800x400?text=Dev+Image';
          }
          const asset = await createAndPublishDevAssetFromUrl(cma, spaceId, environmentId, devUrl);
          urlToAssetId = {};
          for (const u of uniqueUrls) {
            urlToAssetId[u] = asset.sys.id;
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
