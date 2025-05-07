import * as contentful from 'contentful-management';
import { KlaviyoService } from './klaviyo-service';
import console from 'console';

// Define Event types similar to Contentful's App SDK
interface AppEventHandlerRequest {
  headers: {
    'X-Contentful-Topic': string;
    'x-contentful-space-id': string;
    'x-contentful-environment-id': string;
    [key: string]: string;
  };
  body: any;
  type: string;
}

interface AppEventContext {
  appInstallationId: string;
  spaceId?: string;
  environmentId?: string;
  cma: contentful.PlainClientAPI;
  cmaClientOptions?: {
    accessToken: string;
  };
  cmaToken?: string;
  appInstallationParameters?: AppInstallationParameters;
}

interface AppEventHandlerResponse {
  // Empty response for event handlers
}

// Use types from our existing code
interface FieldMapping {
  contentfulFieldId: string;
  fieldType: 'text' | 'image' | 'entry' | 'reference-array' | 'richText' | 'json';
  klaviyoBlockName: string;
  contentTypeId?: string;
  fields?: any;
  name: string;
  type: string;
  severity: string;
  value: any;
  isAssetField?: boolean;
}

interface SyncOptions {
  useSdk?: boolean;
  forceUpdate?: boolean;
}

interface SyncStatus {
  entryId: string;
  contentTypeId: string;
  contentTypeName?: string;
  lastSynced: number;
  fieldsUpdatedAt?: Record<string, number>;
  needsSync: boolean;
  syncCompleted: boolean;
  lastSyncedVersion?: number;
}

interface SyncParameters {
  syncStatuses: SyncStatus[];
  lastUpdated: number;
}

// Define types for field mappings
interface AppFieldMapping {
  contentfulFieldId: string;
  klaviyoBlockName: string;
  fieldType?: string;
  contentTypeId?: string;
}

// Interface for app installation parameters
interface AppInstallationParameters {
  privateKey?: string;
  publicKey?: string;
  redirectUri?: string;
  fieldMappings?: AppFieldMapping[];
  syncData?: SyncParameters;
  appDefinitionId?: string;
  selectedContentTypes?: Record<string, boolean>;
  contentTypeMappings?: Record<string, AppFieldMapping[]>;
  installation?: any;
  [key: string]: any;
}

/**
 * Extract and validate required data from the event
 */
function extractEventData(event: AppEventHandlerRequest): {
  entryId: string;
  contentTypeId: string;
  version: number;
  spaceId: string;
  environmentId: string;
  entryData: any;
} | null {
  try {
    if (!event || !event.headers) {
      console.error('Invalid event structure');
      return null;
    }

    // Extract data from headers
    const spaceId = event.headers['x-contentful-space-id'];
    const environmentId = event.headers['x-contentful-environment-id'];

    if (!spaceId || !environmentId) {
      console.error('Missing space or environment ID in headers');
      return null;
    }

    // Get entry data from body
    let entryData;
    if (typeof event.body === 'string') {
      try {
        entryData = JSON.parse(event.body);
      } catch (error) {
        console.error('Failed to parse entry data from JSON string:', error);
        return null;
      }
    } else if (typeof event.body === 'object') {
      entryData = event.body;
    } else {
      console.error('Invalid entry data format:', typeof event.body);
      return null;
    }

    // Log entry data structure to help debug
    console.log(
      'Entry data structure:',
      JSON.stringify({
        hasEntry: !!entryData,
        hasSys: !!(entryData && entryData.sys),
        type: entryData && entryData.sys ? entryData.sys.type : 'unknown',
        contentType:
          entryData && entryData.sys && entryData.sys.contentType
            ? entryData.sys.contentType.sys.id
            : 'unknown',
      })
    );

    // Validate entry data
    if (!entryData || !entryData.sys) {
      console.error('Invalid entry data in event body');
      return null;
    }

    const entryId = entryData.sys.id;
    let version = entryData.sys.version;

    // Check for content type
    if (
      !entryData.sys.contentType ||
      !entryData.sys.contentType.sys ||
      !entryData.sys.contentType.sys.id
    ) {
      console.error('Missing content type in entry data');
      return null;
    }

    const contentTypeId = entryData.sys.contentType.sys.id;

    // Log what we extracted
    console.log('Extracted entry data:', {
      entryId,
      contentTypeId,
      version,
      spaceId,
      environmentId,
    });

    return {
      entryId,
      contentTypeId,
      version,
      spaceId,
      environmentId,
      entryData,
    };
  } catch (error) {
    console.error('Error extracting event data:', error);
    return null;
  }
}

// The main handler function
export const handler = async (
  event: AppEventHandlerRequest,
  context: AppEventContext
): Promise<AppEventHandlerResponse> => {
  console.log('Handler started with event type:', event.type);
  console.log('Event headers:', JSON.stringify(event.headers));
  console.log(
    'Context received:',
    JSON.stringify({
      spaceId: context.spaceId,
      environmentId: context.environmentId,
      hasParameters: !!context.appInstallationParameters,
    })
  );

  // Only process relevant Entry events
  const topic = event.headers['X-Contentful-Topic'];
  if (!topic || !topic.match(/ContentManagement\.Entry\.(publish|auto_save|save)/)) {
    console.log('Ignoring event with topic:', topic);
    return {};
  }

  try {
    // Extract and validate event data
    const eventData = extractEventData(event);
    if (!eventData) {
      console.error('Failed to extract event data from the event');
      return {};
    }

    const { entryId, contentTypeId, version, spaceId, environmentId, entryData } = eventData;

    // Override with context values if available
    const effectiveSpaceId = context.spaceId || spaceId;
    const effectiveEnvironmentId = context.environmentId || environmentId;

    console.log(
      `Processing entry ${entryId} of content type ${contentTypeId} (version ${version})`
    );
    console.log(`Using space ID: ${effectiveSpaceId}, environment ID: ${effectiveEnvironmentId}`);

    // Initialize CMA client using the token from context
    const accessToken = context.cmaClientOptions?.accessToken || context.cmaToken;
    if (!accessToken) {
      console.error('No access token available in context');
      return {};
    }

    // Use the client from the context if available to avoid adapter issues
    let cma;
    if (context.cma) {
      console.log('Using CMA client from context');
      cma = context.cma;
    } else {
      console.log('Creating new CMA client with fetch adapter');
      // Create client with explicit fetch adapter for serverless environment
      cma = contentful.createClient(
        {
          accessToken,
          adapter: 'fetch' as any, // Force fetch adapter
        },
        {
          type: 'plain',
        }
      );
    }

    // Get parameters from context or by fetching from the API
    let parameters: AppInstallationParameters;
    const appDefinitionId = context.appInstallationId;

    if (context.appInstallationParameters) {
      parameters = context.appInstallationParameters;
      console.log('Using parameters directly from context');
    } else if (appDefinitionId) {
      // Fallback to fetching parameters from the API
      try {
        console.log('Parameters not available in context, fetching from API...');

        // Get the app installation with proper parameters
        const appInstallation = await cma.appInstallation.get({
          appDefinitionId,
          spaceId: effectiveSpaceId,
          environmentId: effectiveEnvironmentId,
        });

        parameters = appInstallation.parameters as AppInstallationParameters;
      } catch (error) {
        console.error('Error fetching app installation parameters:', error);
        parameters = {} as AppInstallationParameters;
      }
    } else {
      console.error('No app definition ID available to fetch parameters');
      parameters = {} as AppInstallationParameters;
    }

    // Store app definition ID for later use
    parameters.appDefinitionId = appDefinitionId;

    // Store app definition ID in globalThis for potential access in other functions
    if (appDefinitionId) {
      (globalThis as any).context = (globalThis as any).context || {};
      (globalThis as any).context.appInstallationId = appDefinitionId;
      console.log(`Stored app definition ID in globalThis.context: ${appDefinitionId}`);
    }

    console.log(`App parameters retrieved, public key exists: ${!!parameters?.publicKey}`);

    // Add detailed parameter structure logging to debug mapping issues
    console.log(
      'Full parameters structure:',
      JSON.stringify({
        hasFieldMappings: !!parameters.fieldMappings,
        fieldMappingsLength: parameters.fieldMappings ? parameters.fieldMappings.length : 0,
        hasContentTypeMappings: !!parameters.contentTypeMappings,
        contentTypeMappingsKeys: parameters.contentTypeMappings
          ? Object.keys(parameters.contentTypeMappings)
          : [],
        hasInstallation: !!parameters.installation,
        installationKeys: parameters.installation ? Object.keys(parameters.installation) : [],
        topLevelKeys: Object.keys(parameters),
      })
    );

    console.log('Parameters:', JSON.stringify(parameters));

    // Log specific information about the contentTypeMappings
    if (parameters.contentTypeMappings) {
      console.log(
        'contentTypeMappings structure:',
        JSON.stringify({
          isObject: typeof parameters.contentTypeMappings === 'object',
          keys: Object.keys(parameters.contentTypeMappings),
          hasCurrentContentType: !!parameters.contentTypeMappings[contentTypeId],
          currentContentTypeMappingsLength: Array.isArray(
            parameters.contentTypeMappings[contentTypeId]
          )
            ? parameters.contentTypeMappings[contentTypeId].length
            : 0,
        })
      );
    }

    // Log specific information about selected content types
    if (parameters.selectedContentTypes) {
      console.log(
        'selectedContentTypes structure:',
        JSON.stringify({
          keys: Object.keys(parameters.selectedContentTypes),
          currentContentTypeSelected: !!parameters.selectedContentTypes[contentTypeId],
        })
      );
    }

    // Initialize field mappings array and locations to check
    let fieldMappings: AppFieldMapping[] = [];

    // 1. Try to get mappings from the entry itself (now using 'klaviyoFieldMappings' field)
    if (
      entryData.fields &&
      entryData.fields.klaviyoFieldMappings &&
      entryData.fields.klaviyoFieldMappings['en-US']
    ) {
      let rawMappings = entryData.fields.klaviyoFieldMappings['en-US'];
      if (typeof rawMappings === 'string') {
        try {
          fieldMappings = JSON.parse(rawMappings);
          console.log(
            `Parsed ${fieldMappings.length} field mappings from JSON string in 'klaviyoFieldMappings'`
          );
        } catch (e) {
          console.error('Failed to parse klaviyoFieldMappings as JSON:', e, rawMappings);
          fieldMappings = [];
        }
      } else if (Array.isArray(rawMappings)) {
        fieldMappings = rawMappings;
        console.log(
          `Retrieved ${fieldMappings.length} field mappings from entry field 'klaviyoFieldMappings'`
        );
      }
    }

    // 2. Fallback to parameters if not found on entry
    if (fieldMappings.length === 0) {
      // First check if we have content type specific mappings
      if (parameters.contentTypeMappings && typeof parameters.contentTypeMappings === 'object') {
        const contentTypeSpecificMappings = parameters.contentTypeMappings[contentTypeId];
        if (Array.isArray(contentTypeSpecificMappings) && contentTypeSpecificMappings.length > 0) {
          console.log(
            `Found ${contentTypeSpecificMappings.length} field mappings specific to content type ${contentTypeId}`
          );
          fieldMappings = contentTypeSpecificMappings;
        }
      }

      // If no content type specific mappings were found, check the general fieldMappings
      if (fieldMappings.length === 0 && Array.isArray(parameters.fieldMappings)) {
        const filteredMappings = parameters.fieldMappings.filter(
          (mapping: any) => !mapping.contentTypeId || mapping.contentTypeId === contentTypeId
        );

        if (filteredMappings.length > 0) {
          console.log(
            `Using ${filteredMappings.length} field mappings from general fieldMappings array`
          );
          fieldMappings = filteredMappings;
        }
      }

      // If still no mappings, check inside installation object as fallback
      if (fieldMappings.length === 0 && parameters.installation) {
        // Check installation.contentTypeMappings
        if (
          parameters.installation.contentTypeMappings &&
          parameters.installation.contentTypeMappings[contentTypeId] &&
          Array.isArray(parameters.installation.contentTypeMappings[contentTypeId])
        ) {
          fieldMappings = parameters.installation.contentTypeMappings[contentTypeId];
          console.log(
            `Found ${fieldMappings.length} mappings in installation.contentTypeMappings[${contentTypeId}]`
          );
        }
        // Check installation.fieldMappings
        else if (Array.isArray(parameters.installation.fieldMappings)) {
          const filteredMappings = parameters.installation.fieldMappings.filter(
            (mapping: any) => !mapping.contentTypeId || mapping.contentTypeId === contentTypeId
          );

          if (filteredMappings.length > 0) {
            console.log(`Found ${filteredMappings.length} mappings in installation.fieldMappings`);
            fieldMappings = filteredMappings;
          }
        }
      }
    }

    console.log(`Retrieved ${fieldMappings.length} field mappings from parameters`);

    // Process the field mappings
    const processedMappings = fieldMappings.map((mapping: any) => {
      // Support both legacy and new mapping keys
      const contentfulFieldId = mapping.contentfulFieldId || mapping.id;
      const klaviyoBlockName = mapping.klaviyoBlockName || mapping.name || contentfulFieldId;
      const fieldType = mapping.fieldType || mapping.type || 'text';
      return {
        contentfulFieldId,
        klaviyoBlockName,
        fieldType,
        contentTypeId: mapping.contentTypeId,
        // add any other fields you need
      };
    });

    console.log(`Processing ${processedMappings.length} field mappings`);

    // Get API keys from app parameters
    const privateKey = parameters?.privateKey;
    const publicKey = parameters?.publicKey;

    if (!privateKey || !publicKey) {
      console.error('API keys not found in app parameters:', {
        hasPrivateKey: !!privateKey,
        hasPublicKey: !!publicKey,
        parameterKeys: Object.keys(parameters || {}),
      });
      return {};
    }

    // Create the auth string - Klaviyo expects "Klaviyo-API-Key {private-key}"
    const auth = `Klaviyo-API-Key ${privateKey}`;

    // Initialize the Klaviyo service
    const klaviyoService = new KlaviyoService({
      privateKey,
      publicKey,
      auth,
    });

    // Get the actual entry data with all fields
    let entry;
    try {
      console.log(`Fetching entry data for ${entryId}`);
      entry = await cma.entry.get({
        entryId,
        spaceId: effectiveSpaceId,
        environmentId: effectiveEnvironmentId,
      });
      console.log(
        `Successfully fetched entry data with ${Object.keys(entry.fields || {}).length} fields`
      );
    } catch (error: any) {
      console.error('Error fetching entry data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return {};
    }

    // Create field mappings in the expected format for Klaviyo service
    const klaviyoFieldMappings: FieldMapping[] = processedMappings.map((mapping: any) => {
      // Try to get field value
      let fieldValue: any = '';
      let fieldName = mapping.contentfulFieldId;
      let fieldType = mapping.fieldType || 'text';
      let isAssetField = false;

      try {
        if (entry.fields && entry.fields[mapping.contentfulFieldId]) {
          const field = entry.fields[mapping.contentfulFieldId];

          // Get appropriate locale version
          const locales = Object.keys(field);
          const locale = locales.includes('en-US') ? 'en-US' : locales[0];

          fieldValue = field[locale];

          // Check if this is an asset field
          if (
            fieldValue &&
            typeof fieldValue === 'object' &&
            fieldValue.sys &&
            (fieldValue.sys.linkType === 'Asset' || fieldValue.sys.type === 'Asset')
          ) {
            isAssetField = true;
            fieldType = 'image';
          }
        }
      } catch (error) {
        console.error(`Error accessing field ${mapping.contentfulFieldId}:`, error);
      }

      // Create the mapping with appropriate type and metadata
      return {
        contentfulFieldId: mapping.contentfulFieldId,
        klaviyoBlockName: mapping.klaviyoBlockName || mapping.contentfulFieldId,
        fieldType: fieldType as
          | 'text'
          | 'image'
          | 'entry'
          | 'reference-array'
          | 'richText'
          | 'json',
        contentTypeId,
        name: mapping.name || fieldName,
        type: mapping.type || fieldType,
        severity: 'info',
        value: fieldValue,
        isAssetField,
      };
    });

    console.log('Prepared field mappings for Klaviyo:', klaviyoFieldMappings);

    // Add space ID to entry if it's not already there
    if (effectiveSpaceId) {
      if (!entry.sys) {
        entry.sys = {} as any;
      }
      if (!entry.sys.space) {
        entry.sys.space = {
          sys: {
            type: 'Link',
            linkType: 'Space',
            id: effectiveSpaceId,
          },
        } as any;
      }
      // Also add as a direct property for easier access
      (entry as any).spaceId = effectiveSpaceId;
    }

    // Actually sync the content to Klaviyo
    const syncResult = await klaviyoService.syncContent(klaviyoFieldMappings, entry, cma);
    console.log('Sync result:', syncResult);

    // Update sync status in app parameters
    await updateSyncStatus(
      cma,
      entryId,
      contentTypeId,
      version,
      effectiveSpaceId,
      effectiveEnvironmentId,
      parameters
    );

    console.log(`Successfully synced entry ${entryId} to Klaviyo`);

    return {};
  } catch (error) {
    console.error('Error processing entry sync:', error);
    return {};
  }
};

// Update sync status in app parameters
async function updateSyncStatus(
  cma: contentful.PlainClientAPI,
  entryId: string,
  contentTypeId: string,
  version: number,
  spaceId: string,
  environmentId: string,
  currentParameters: AppInstallationParameters
): Promise<void> {
  try {
    // Get existing sync data or initialize new
    const syncData: SyncParameters = currentParameters?.syncData || {
      syncStatuses: [],
      lastUpdated: Date.now(),
    };

    // Find if this entry already has a status
    const existingIndex = syncData.syncStatuses.findIndex(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    const now = Date.now();

    if (existingIndex >= 0) {
      // Update existing status
      syncData.syncStatuses[existingIndex].lastSynced = now;
      syncData.syncStatuses[existingIndex].syncCompleted = true;
      syncData.syncStatuses[existingIndex].needsSync = false;
      syncData.syncStatuses[existingIndex].lastSyncedVersion = version;
    } else {
      // Add new status
      syncData.syncStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: now,
        needsSync: false,
        syncCompleted: true,
        lastSyncedVersion: version,
      });
    }

    // Update timestamp
    syncData.lastUpdated = now;

    // Create updated parameters
    const updatedParameters = {
      ...currentParameters,
      syncData,
    };

    // Ensure contentTypeMappings exists for this content type
    if (!updatedParameters.contentTypeMappings) {
      updatedParameters.contentTypeMappings = {};
    }

    // Ensure we have an entry for this content type in selectedContentTypes
    if (!updatedParameters.selectedContentTypes) {
      updatedParameters.selectedContentTypes = {};
    }

    updatedParameters.selectedContentTypes[contentTypeId] = true;

    // If we don't have mappings for this content type but we have fieldMappings,
    // check if any of them apply to this content type and organize them
    if (
      !updatedParameters.contentTypeMappings[contentTypeId] &&
      Array.isArray(updatedParameters.fieldMappings) &&
      updatedParameters.fieldMappings.length > 0
    ) {
      const relevantMappings = updatedParameters.fieldMappings.filter(
        (mapping: any) => mapping.contentTypeId === contentTypeId || !mapping.contentTypeId
      );

      if (relevantMappings.length > 0) {
        console.log(
          `Adding ${relevantMappings.length} relevant mappings to contentTypeMappings.${contentTypeId}`
        );
        updatedParameters.contentTypeMappings[contentTypeId] = relevantMappings;
      }
    }

    // Save back to app parameters using the contentful API
    try {
      // Look for app definition ID in multiple places
      let appDefinitionId = currentParameters.appDefinitionId;

      // Check in installation object if main level doesn't have it
      if (
        !appDefinitionId &&
        currentParameters.installation &&
        currentParameters.installation.appDefinitionId
      ) {
        appDefinitionId = currentParameters.installation.appDefinitionId;
        console.log(`Found app definition ID in installation: ${appDefinitionId}`);
      }

      // Check context as last resort
      if (!appDefinitionId) {
        // Try to get from globalThis or context
        if ((globalThis as any)?.context?.appInstallationId) {
          appDefinitionId = (globalThis as any).context.appInstallationId;
          console.log(`Using app definition ID from globalThis context: ${appDefinitionId}`);
        } else if ((global as any)?.context?.appInstallationId) {
          appDefinitionId = (global as any).context.appInstallationId;
          console.log(`Using app definition ID from global context: ${appDefinitionId}`);
        }
      }

      // Add the app definition ID to the parameters to ensure it's saved for future use
      updatedParameters.appDefinitionId = appDefinitionId;

      console.log(`Updated sync status for entry ${entryId}`);
    } catch (e) {
      console.error('Error updating app installation parameters:', e);
      // Even if we couldn't update the sync status, we still successfully synced the content
      console.log(
        `Successfully synced entry ${entryId} to Klaviyo but could not update sync status`
      );
    }
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
}

// Helper function to determine field type from value
function getFieldType(fieldValue: any): 'text' | 'image' | 'richText' | 'json' {
  if (!fieldValue) return 'text';

  // Get the first locale's value if it's an object with locales
  let value = fieldValue;
  const firstLocale = Object.keys(fieldValue)[0];
  if (firstLocale && typeof fieldValue[firstLocale] !== 'undefined') {
    value = fieldValue[firstLocale];
  }

  // Check for rich text structure
  if (value && typeof value === 'object' && value.nodeType === 'document') {
    return 'richText';
  }

  // Check for asset link
  if (value && typeof value === 'object' && value.sys && value.sys.linkType === 'Asset') {
    return 'image';
  }

  // Check for complex objects/arrays
  if (typeof value === 'object' && value !== null) {
    return 'json';
  }

  // Default to text for simple values
  return 'text';
}
