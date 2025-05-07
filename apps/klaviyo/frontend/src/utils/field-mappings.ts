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
 * Get klaviyo field mappings from a Contentful entry (JSON-stringified array of objects)
 * @param sdk The Contentful SDK instance
 * @param entryId The ID of the entry
 * @returns Array of field mappings or empty array if none found
 */
export const getEntryKlaviyoFieldMappings = async (sdk: any, entryId: string): Promise<any[]> => {
  try {
    const entry = await sdk.cma.entry.get({
      entryId,
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    });
    const raw = entry.fields?.klaviyoFieldMappings?.['en-US'];
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      logger.error('Failed to parse klaviyoFieldMappings JSON:', e);
      return [];
    }
  } catch (error) {
    logger.error('Error fetching entry for klaviyoFieldMappings:', error);
    return [];
  }
};

/**
 * Set klaviyo field mappings on a Contentful entry (as JSON-stringified array of objects)
 * @param sdk The Contentful SDK instance
 * @param entryId The ID of the entry
 * @param mappings Array of field mapping objects
 */
export const setEntryKlaviyoFieldMappings = async (
  sdk: any,
  entryId: string,
  mappings: any[]
): Promise<void> => {
  try {
    const entry = await sdk.cma.entry.get({
      entryId,
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    });
    entry.fields = entry.fields || {};
    entry.fields.klaviyoFieldMappings = { 'en-US': JSON.stringify(mappings) };
    await sdk.cma.entry.update(
      { entryId, spaceId: sdk.ids.space, environmentId: sdk.ids.environment },
      entry
    );
  } catch (error) {
    logger.error('Error setting klaviyoFieldMappings on entry:', error);
  }
};
