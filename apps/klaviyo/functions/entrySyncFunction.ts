import * as contentful from 'contentful-management';
import { KlaviyoService } from './klaviyoService';
import console from 'console';
import { getEntryKlaviyoFieldMappings } from '../src/utils/field-mappings';
import { OAuthSDK } from './initiateOauth';

// Define Event types similar to Contentful's App SDK
export interface AppEventHandlerRequest {
  headers: {
    'X-Contentful-Topic': string;
    'x-contentful-space-id': string;
    'x-contentful-environment-id': string;
    [key: string]: string;
  };
  body: any;
  type: string;
  code?: string;
  state?: string;
}

export interface AppEventContext {
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

export interface AppEventHandlerResponse {
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
  locale?: string;
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
  name?: string;
  type?: string;
  severity?: string;
  value?: any;
  isAssetField?: boolean;
  locale?: string;
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
  selectedLocales?: string[];
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
  context: AppEventContext & { oauthSdk: OAuthSDK }
): Promise<AppEventHandlerResponse> => {
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

    const { entryId, contentTypeId, spaceId, environmentId, entryData } = eventData;

    // Override with context values if available
    const effectiveSpaceId = context.spaceId || spaceId;
    const effectiveEnvironmentId = context.environmentId || environmentId;

    // Initialize CMA client using the token from context
    const accessToken = context.cmaClientOptions?.accessToken || context.cmaToken;
    if (!accessToken) {
      console.error('No access token available in context');
      return {};
    }

    // Use the client from the context if available to avoid adapter issues
    let cma;
    if (context.cma) {
      cma = context.cma;
    } else {
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
    } else if (appDefinitionId) {
      // Fallback to fetching parameters from the API
      try {
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

    if (!effectiveSpaceId || !effectiveEnvironmentId) {
      throw new Error('effectiveSpaceId or effectiveEnvironmentId is missing');
    }
    // Fetch mappings from the centralized klaviyoFieldMappings entry
    const fieldMappings = await getEntryKlaviyoFieldMappings(
      cma,
      entryId,
      effectiveSpaceId,
      effectiveEnvironmentId
    );

    // Process the field mappings
    const processedMappings = fieldMappings.map(
      (mapping: {
        id?: string;
        contentfulFieldId?: string;
        klaviyoBlockName: string;
        fieldType: string;
        contentTypeId: string;
        name: string;
        type: string;
        severity: string;
        value: any;
        isAssetField: boolean;
        locale: string;
      }) => {
        // Support both legacy and new mapping keys
        const contentfulFieldId = mapping.contentfulFieldId || mapping.id;
        const klaviyoBlockName = mapping.klaviyoBlockName || mapping.name || contentfulFieldId;
        const fieldType = mapping.fieldType || mapping.type || 'text';
        return {
          contentfulFieldId,
          klaviyoBlockName,
          fieldType,
          contentTypeId: mapping.contentTypeId,
          name: mapping.name || contentfulFieldId,
          type: mapping.type || fieldType,
          severity: 'info',
          value: mapping.value,
          isAssetField: mapping.isAssetField,
          locale: mapping.locale,
        };
      }
    );

    // Initialize the Klaviyo service
    const klaviyoService = new KlaviyoService(context.oauthSdk);

    // Get the actual entry data with all fields
    let entry;
    try {
      entry = await cma.entry.get({
        entryId,
        spaceId: effectiveSpaceId,
        environmentId: effectiveEnvironmentId,
      });
    } catch (error: any) {
      console.error('Error fetching entry data:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return {};
    }

    // Determine selected locales
    let selectedLocales: string[] = [];
    if (Array.isArray(parameters.selectedLocales) && parameters.selectedLocales.length > 0) {
      selectedLocales = parameters.selectedLocales;
    } else {
      // Fallback: try to get all locales from the entry fields
      const allLocalesSet = new Set<string>();
      if (entryData.fields) {
        Object.values(entryData.fields).forEach((field: any) => {
          if (field && typeof field === 'object' && !Array.isArray(field)) {
            Object.keys(field).forEach((locale) => allLocalesSet.add(locale));
          }
        });
      }
      selectedLocales = Array.from(allLocalesSet);
      if (selectedLocales.length === 0) {
        selectedLocales = ['en-US']; // fallback default
      }
    }

    // Create field mappings in the expected format for Klaviyo service
    const klaviyoFieldMappings: FieldMapping[] = [];
    for (const mapping of processedMappings) {
      // Check if this mapping specifies a specific locale
      const mappingLocale = mapping.locale;
      const contentfulFieldId = mapping.contentfulFieldId || '';

      if (mappingLocale) {
        // This mapping is for a specific locale - only process that locale
        let fieldType = mapping.fieldType || 'text';
        let isAssetField = false;

        // Only create a mapping if the field has a value for this specific locale
        if (
          entry.fields &&
          entry.fields[contentfulFieldId] &&
          typeof entry.fields[contentfulFieldId] === 'object' &&
          entry.fields[contentfulFieldId][mappingLocale] !== undefined
        ) {
          let fieldValue = entry.fields[contentfulFieldId][mappingLocale];

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

          klaviyoFieldMappings.push({
            contentfulFieldId: contentfulFieldId,
            klaviyoBlockName: mapping.klaviyoBlockName || contentfulFieldId,
            fieldType: fieldType as
              | 'text'
              | 'image'
              | 'entry'
              | 'reference-array'
              | 'richText'
              | 'json',
            contentTypeId,
            name: mapping.name || contentfulFieldId,
            type: mapping.type || fieldType,
            severity: 'info',
            value: fieldValue,
            isAssetField,
            locale: mappingLocale,
          });
        }
      } else {
        // This mapping doesn't specify a locale - it's either non-localized or we need to process the default locale
        let fieldType = mapping.fieldType || 'text';
        let isAssetField = false;
        let fieldValue;

        // Check if the field is localized or not
        if (
          entry.fields &&
          entry.fields[contentfulFieldId] &&
          typeof entry.fields[contentfulFieldId] === 'object'
        ) {
          // Field is localized - use the first available locale or 'en-US' as fallback
          const availableLocales = Object.keys(entry.fields[contentfulFieldId]).filter(
            (locale) => entry.fields[contentfulFieldId][locale] !== undefined
          );

          if (availableLocales.length > 0) {
            const defaultLocale = availableLocales.includes('en-US')
              ? 'en-US'
              : availableLocales[0];
            fieldValue = entry.fields[contentfulFieldId][defaultLocale];
          }
        } else if (entry.fields && entry.fields[contentfulFieldId] !== undefined) {
          // Field is not localized
          fieldValue = entry.fields[contentfulFieldId];
        }

        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
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

          klaviyoFieldMappings.push({
            contentfulFieldId: contentfulFieldId,
            klaviyoBlockName: mapping.klaviyoBlockName || contentfulFieldId,
            fieldType: fieldType as
              | 'text'
              | 'image'
              | 'entry'
              | 'reference-array'
              | 'richText'
              | 'json',
            contentTypeId,
            name: mapping.name || contentfulFieldId,
            type: mapping.type || fieldType,
            severity: 'info',
            value: fieldValue,
            isAssetField,
            locale: undefined, // No specific locale for non-localized fields
          });
        }
      }
    }

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

    await klaviyoService.syncContent(klaviyoFieldMappings, entry, cma);

    return {};
  } catch (error) {
    console.error('Error processing entry sync:', error);
    return {};
  }
};
