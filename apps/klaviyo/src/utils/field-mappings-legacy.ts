import { BaseAppSDK } from '@contentful/app-sdk';
import logger from './logger';

// Legacy field-mapping storage: a JSON blob in one `klaviyoFieldMappings`
// CMA entry, read/written in full on every call. Superseded by
// context.storage (PIC-1321) but kept here as the fallback used by
// functions/getFieldMappings.ts and functions/setFieldMappings.ts until the
// platform actually ships that capability — see docs/ADRs/0007. Not used by
// the frontend anymore; UI components go through src/utils/field-mappings-client.ts.

/**
 * Get every klaviyo field mapping from the central klaviyoFieldMappings
 * entry, across all entries — the entry stores one JSON array covering the
 * whole installation, not one entry per mapped Contentful entry. Used by the
 * getFieldMappings storage migration to bulk-backfill context.storage.
 * @param sdk The Contentful SDK instance, or a raw CMA client (e.g. context.cma in a Function)
 */
export const getAllKlaviyoFieldMappings = async (
  sdkOrCma: BaseAppSDK | any,
  spaceIdParam?: string,
  environmentIdParam?: string
): Promise<any[]> => {
  try {
    const spaceId = spaceIdParam || sdkOrCma.ids.space;
    const environmentId = environmentIdParam || sdkOrCma.ids.environment;
    let cma;
    if (sdkOrCma.cma) {
      cma = sdkOrCma.cma;
    } else {
      cma = sdkOrCma;
    }
    const defaultLocale = sdkOrCma.locales?.default || 'en-US';
    // Find the klaviyoFieldMappings entries
    const entries = await cma.entry.getMany({
      spaceId,
      environmentId,
      content_type: 'klaviyoFieldMappings',
      limit: 100,
    } as any);
    // Find the first entry with a valid stringified mappings field
    const localeKey = defaultLocale;
    const mappingEntry = entries.items.find(
      (item: any) =>
        item.fields &&
        item.fields.mappings &&
        typeof (item.fields.mappings[localeKey] || Object.values(item.fields.mappings)[0]) ===
          'string'
    );
    if (!mappingEntry) {
      console.warn('No valid klaviyoFieldMappings entry found');
      return [];
    }
    const raw = mappingEntry.fields?.mappings;
    if (!raw) return [];
    let allMappings: any[] = [];
    try {
      let mappingsValue = raw[localeKey] || Object.values(raw)[0];
      if (typeof mappingsValue === 'string') {
        allMappings = JSON.parse(mappingsValue);
      } else if (Array.isArray(mappingsValue)) {
        allMappings = mappingsValue;
      } else if (typeof mappingsValue === 'object' && mappingsValue !== null) {
        allMappings = [mappingsValue];
      } else {
        allMappings = [];
      }
      if (!Array.isArray(allMappings)) {
        console.error('klaviyoFieldMappings.mappings is not an array:', allMappings);
        allMappings = [];
      }
    } catch (e) {
      console.error('Failed to parse klaviyoFieldMappings.mappings JSON:', e);
      allMappings = [];
    }
    return allMappings;
  } catch (error) {
    console.error('Error fetching klaviyoFieldMappings entry:', error);
    return [];
  }
};

/**
 * Get klaviyo field mappings for a specific entry from the central klaviyoFieldMappings entry.
 * @param sdk The Contentful SDK instance
 * @param entryId The ID of the entry whose mappings you want
 * @returns Array of field mappings for the entryId, or empty array if none found
 */
export const getEntryKlaviyoFieldMappings = async (
  sdkOrCma: BaseAppSDK | any,
  entryId: string,
  spaceIdParam?: string,
  environmentIdParam?: string
): Promise<any[]> => {
  const allMappings = await getAllKlaviyoFieldMappings(sdkOrCma, spaceIdParam, environmentIdParam);
  // Filter for the requested entryId
  return allMappings.filter((m) => m.entryId === entryId);
};

/**
 * Set klaviyo field mappings for a specific entry in the central klaviyoFieldMappings entry.
 * @param sdkOrCma The Contentful SDK instance, or a raw CMA client (e.g. context.cma in a Function)
 * @param entryId The ID of the entry
 * @param mappings Array of field mapping objects for this entry
 * @param spaceIdParam Required when sdkOrCma is a raw CMA client (no `.ids`)
 * @param environmentIdParam Required when sdkOrCma is a raw CMA client (no `.ids`)
 */
export const setEntryKlaviyoFieldMappings = async (
  sdkOrCma: BaseAppSDK | any,
  entryId: string,
  mappings: any[],
  spaceIdParam?: string,
  environmentIdParam?: string
): Promise<void> => {
  try {
    const spaceId = spaceIdParam || sdkOrCma.ids.space;
    const environmentId = environmentIdParam || sdkOrCma.ids.environment;
    const cma = sdkOrCma.cma || sdkOrCma;
    const defaultLocale = sdkOrCma.locales?.default || 'en-US';

    // Fetch all klaviyoFieldMappings entries
    const entries = await cma.entry.getMany({
      spaceId,
      environmentId,
      content_type: 'klaviyoFieldMappings',
      limit: 100,
    } as any);
    // Use the first valid entry
    let mappingEntry = entries.items.find(
      (entry: any) =>
        entry.sys.contentType &&
        entry.sys.contentType.sys.id === 'klaviyoFieldMappings' &&
        entry.fields &&
        entry.fields.mappings
    );
    // If not found, create it
    if (!mappingEntry) {
      // create the content type if it doesn't exist
      const contentType = await cma.contentType.createWithId(
        {
          spaceId,
          environmentId,
          contentTypeId: 'klaviyoFieldMappings',
        },
        {
          name: 'Klaviyo Field Mappings',
          fields: [
            {
              id: 'mappings',
              name: 'Mappings',
              type: 'Text',
              required: true,
              localized: false,
            },
          ],
        }
      );

      // Publish the content type
      await cma.contentType.publish(
        {
          spaceId,
          environmentId,
          contentTypeId: 'klaviyoFieldMappings',
        },
        {
          version: 1,
          ...contentType,
        }
      );

      mappingEntry = await cma.entry.create(
        {
          spaceId,
          environmentId,
          contentTypeId: 'klaviyoFieldMappings',
        } as any,
        {
          fields: {
            mappings: {
              [defaultLocale]: JSON.stringify([]),
            },
          },
        }
      );
      // Optionally publish the entry
      await cma.entry.publish(
        {
          entryId: mappingEntry.sys.id,
          spaceId,
          environmentId,
        },
        mappingEntry
      );
      // Re-fetch the entry to get the latest sys.version
      mappingEntry = await cma.entry.get({
        entryId: mappingEntry.sys.id,
        spaceId,
        environmentId,
      });
    }
    // Defensive: ensure we have the correct entry type
    if (
      !mappingEntry.sys.contentType ||
      mappingEntry.sys.contentType.sys.id !== 'klaviyoFieldMappings'
    ) {
      throw new Error('Could not find or create a klaviyoFieldMappings entry.');
    }
    // Parse existing mappings
    let allMappings: any[] = [];
    if (mappingEntry.fields && mappingEntry.fields.mappings) {
      try {
        const mappingsField = mappingEntry.fields.mappings;
        let mappingsValue =
          typeof mappingsField === 'string'
            ? mappingsField
            : mappingsField[defaultLocale] || Object.values(mappingsField)[0];
        if (typeof mappingsValue === 'string') {
          allMappings = JSON.parse(mappingsValue);
        } else if (Array.isArray(mappingsValue)) {
          allMappings = mappingsValue;
        } else if (typeof mappingsValue === 'object' && mappingsValue !== null) {
          allMappings = [mappingsValue];
        } else {
          allMappings = [];
        }
        if (!Array.isArray(allMappings)) {
          logger.error('klaviyoFieldMappings.mappings is not an array:', allMappings);
          allMappings = [];
        }
      } catch (e) {
        logger.error('Failed to parse klaviyoFieldMappings.mappings JSON:', e);
        allMappings = [];
      }
    }
    // Remove old mappings for this entryId
    const filtered = allMappings.filter((m) => m.entryId !== entryId);
    // Add new mappings (ensure each has entryId)
    const newMappings = mappings.map((m) => ({ ...m, entryId }));
    const updated = [...filtered, ...newMappings];
    // Update the entry (localized field, pass full sys object)
    await cma.entry.update(
      {
        entryId: mappingEntry.sys.id,
        spaceId,
        environmentId,
      },
      {
        sys: mappingEntry.sys,
        fields: {
          mappings: {
            [defaultLocale]: JSON.stringify(updated),
          },
        },
      }
    );
  } catch (error) {
    logger.error('Error setting klaviyoFieldMappings in central entry:', error);
  }
};
