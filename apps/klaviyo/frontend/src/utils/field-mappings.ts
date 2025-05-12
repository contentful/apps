import { SidebarExtensionSDK } from '@contentful/app-sdk';
import logger from './logger';

/**
 * Get field mappings for the current content type from app parameters
 *
 * @param sdk The Contentful SDK instance
 * @returns Array of field mappings or empty array if none found
 */
export const getFieldMappings = async (sdk: SidebarExtensionSDK): Promise<any[]> => {
  try {
    // Get content type ID
    const contentTypeId = sdk.ids.contentType;

    if (!contentTypeId) {
      logger.warn('No content type ID found in SDK');
      return [];
    }

    logger.log(`Getting field mappings for content type: ${contentTypeId}`);

    // Try to get from app parameters
    try {
      const appParams = sdk.parameters.installation;

      if (!appParams) {
        logger.warn('No app parameters found');
        return [];
      }

      // Check for content type specific mappings first
      if (appParams.installation?.contentTypeMappings?.[contentTypeId]) {
        const mappings = appParams.installation.contentTypeMappings[contentTypeId];
        logger.log(`Found ${mappings.length} content type specific mappings`);
        return mappings;
      }

      // Fall back to general field mappings
      if (appParams.installation?.fieldMappings) {
        const mappings = appParams.installation.fieldMappings;
        logger.log(`Found ${mappings.length} general field mappings`);

        // Filter to only include mappings for this content type if specified
        if (mappings.length > 0 && mappings[0].contentTypeId) {
          const filtered = mappings.filter(
            (mapping: { contentTypeId: string }) => mapping.contentTypeId === contentTypeId
          );
          logger.log(`Filtered to ${filtered.length} mappings for current content type`);
          return filtered;
        }

        return mappings;
      }
    } catch (error) {
      logger.error('Error getting app parameters:', error);
    }

    // Last resort - try to get from installation parameters
    try {
      const installParams = sdk.parameters?.installation;

      if (installParams?.fieldMappings) {
        const mappings = installParams.fieldMappings;
        logger.log(`Found ${mappings.length} mappings in installation parameters`);
        return mappings;
      }
    } catch (error) {
      logger.error('Error accessing installation parameters:', error);
    }

    // No mappings found
    logger.warn('No field mappings found for this content type');
    return [];
  } catch (error) {
    logger.error('Error getting field mappings:', error);
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
  sdkOrCma: any,
  entryId: string,
  spaceId?: string,
  environmentId?: string
): Promise<any[]> => {
  console.log('getEntryKlaviyoFieldMappings called with:', { spaceId, environmentId });
  try {
    let cma: any;
    let defaultLocale: string | undefined;
    // Detect if this is the App SDK or plain CMA client
    if (sdkOrCma.cma && sdkOrCma.ids) {
      // App SDK
      spaceId = sdkOrCma.ids.space;
      environmentId = sdkOrCma.ids.environment;
      cma = sdkOrCma.cma;
      defaultLocale = sdkOrCma.locales?.default || 'en-US';
    } else {
      // Plain CMA client (lambda/app action)
      cma = sdkOrCma;
      // Use passed-in values if available
      spaceId = spaceId || process.env.CONTENTFUL_SPACE_ID;
      environmentId = environmentId || process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';
      defaultLocale = 'en-US'; // fallback
    }
    if (!spaceId || !environmentId) {
      console.error('Missing spaceId or environmentId in getEntryKlaviyoFieldMappings');
      return [];
    }
    // Find the klaviyoFieldMappings entries
    const entries = await cma.entry.getMany({
      spaceId,
      environmentId,
      content_type: 'klaviyoFieldMappings',
      limit: 100,
    } as any);
    console.log('entries from getEntryKlaviyoFieldMappings', entries);
    // Find the first entry with a valid stringified mappings field
    const localeKey = defaultLocale || 'en-US';
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
    // Filter for the requested entryId
    return allMappings.filter((m) => m.entryId === entryId);
  } catch (error) {
    console.error('Error fetching klaviyoFieldMappings entry:', error);
    return [];
  }
};

/**
 * Set klaviyo field mappings for a specific entry in the central klaviyoFieldMappings entry.
 * @param sdk The Contentful SDK instance
 * @param entryId The ID of the entry
 * @param mappings Array of field mapping objects for this entry
 */
export const setEntryKlaviyoFieldMappings = async (
  sdk: any,
  entryId: string,
  mappings: any[]
): Promise<void> => {
  try {
    // Fetch all klaviyoFieldMappings entries
    const entries = await sdk.cma.entry.getMany({
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
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
      const defaultLocale = sdk.locales?.default || 'en-US';
      mappingEntry = await sdk.cma.entry.create(
        {
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
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
      await sdk.cma.entry.publish(
        {
          entryId: mappingEntry.sys.id,
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
        },
        mappingEntry
      );
      // Re-fetch the entry to get the latest sys.version
      mappingEntry = await sdk.cma.entry.get({
        entryId: mappingEntry.sys.id,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
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
            : mappingsField[sdk.locales?.default || 'en-US'] || Object.values(mappingsField)[0];
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
    await sdk.cma.entry.update(
      {
        entryId: mappingEntry.sys.id,
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
      },
      {
        sys: mappingEntry.sys,
        fields: {
          mappings: {
            [sdk.locales?.default || 'en-US']: JSON.stringify(updated),
          },
        },
      }
    );
  } catch (error) {
    logger.error('Error setting klaviyoFieldMappings in central entry:', error);
  }
};
