import { useSDK } from '@contentful/react-apps-toolkit';
import { PageAppSDK } from '@contentful/app-sdk';

/**
 * Hook to search entries by field value (for natural key matching)
 */
export function useEntriesSearch() {
  const sdk = useSDK<PageAppSDK>();

  /**
   * Search for entries by a field value
   * Returns array of matching entry IDs
   */
  async function searchByField(
    contentTypeId: string,
    fieldId: string,
    value: string,
    locale?: string
  ): Promise<string[]> {
    try {
      const query: any = {
        content_type: contentTypeId,
        limit: 2, // We only need to know if there's 0, 1, or >1 matches
      };

      // Build the field query
      if (locale) {
        query[`fields.${fieldId}[match]`] = value;
        query.locale = locale;
      } else {
        query[`fields.${fieldId}[match]`] = value;
      }

      const response = await sdk.cma.entry.getMany({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        query,
      });

      return response.items.map((entry) => entry.sys.id);
    } catch (err) {
      console.error('Error searching entries:', err);
      return [];
    }
  }

  /**
   * Check if an entry exists by ID
   */
  async function entryExists(entryId: string): Promise<boolean> {
    try {
      await sdk.cma.entry.get({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entryId,
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Batch check if multiple entries exist
   * Returns a Set of entry IDs that exist
   */
  async function batchCheckEntries(entryIds: string[]): Promise<Set<string>> {
    const existingIds = new Set<string>();

    // Check in parallel with Promise.all
    const results = await Promise.allSettled(
      entryIds.map(async (id) => {
        const exists = await entryExists(id);
        return { id, exists };
      })
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.exists) {
        existingIds.add(result.value.id);
      }
    });

    return existingIds;
  }

  return {
    searchByField,
    entryExists,
    batchCheckEntries,
  };
}
