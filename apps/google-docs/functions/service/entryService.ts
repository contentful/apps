import { PlainClientAPI, EntryProps } from 'contentful-management';
import { EntryToCreate } from '../agents/documentParserAgent/schema';

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
  config: { spaceId: string; environmentId: string }
): Promise<EntryCreationResult> {
  const { spaceId, environmentId } = config;
  const createdEntries: EntryProps[] = [];
  const errors: Array<{ contentTypeId: string; error: string; details?: any }> = [];

  // Create entries sequentially to avoid rate limiting issues
  // In production, you may want to implement batching and retry logic
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    try {
      const createdEntry = await cma.entry.create(
        { spaceId, environmentId, contentTypeId: entry.contentTypeId },
        {
          fields: entry.fields,
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
