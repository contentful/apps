import React from 'react';
import { logger } from '../utils/logger';

/**
 * Interface representing field data structure
 */
export interface FieldData {
  id: string;
  name: string;
  type: string;
  value: any;
  isAsset: boolean;
  assetDetails?: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    fileName: string;
    contentType: string;
  }>;
  contentTypeId?: string;
  htmlValue?: string; // <-- Add this for rich text HTML
}

// Track field changes with timestamps
export interface FieldChangeTracker {
  fieldId: string;
  lastModified: number;
  originalValue: any;
  currentValue: any;
}

/**
 * Interface representing Klaviyo API configuration
 */
export interface KlaviyoConfig {
  publicKey: string;
  privateKey?: string;
  listId?: string;
  endpoint?: string;
}

/**
 * Interface for tracking sync status of entries
 */
export interface SyncStatus {
  entryId: string;
  contentTypeId: string;
  contentTypeName?: string;
  lastSynced: number; // timestamp
  fieldsUpdatedAt?: Record<string, number>; // fieldId -> last update timestamp
  needsSync: boolean;
  syncCompleted: boolean;
  lastSyncedVersion?: number; // Add this new field to track the entry version
}

/**
 * Interface for storing sync data in Contentful's instance parameters
 */
export interface SyncParameters {
  syncStatuses: SyncStatus[];
  lastUpdated: number;
}

/**
 * Interface for sync options
 */
export interface SyncOptions {
  useSdk?: boolean; // Whether to use SDK for storing sync status vs localStorage
  forceUpdate?: boolean; // Whether to force an update regardless of sync status
  entryId?: string; // Optional entry ID to use if not available in sdk.ids
  contentTypeId?: string; // Optional content type ID to use if not available in sdk.ids
}

/**
 * Sends data to Klaviyo API
 * @param config Klaviyo API configuration
 * @param fieldMappings Field mappings for the data
 * @param entryData The entry data to be sent
 * @returns Response from the Klaviyo API
 */
export const sendToKlaviyo = async (
  config: KlaviyoConfig,
  fieldMapping: Record<string, string>,
  entryData: Record<string, FieldData>
): Promise<any> => {
  try {
    if (!config.publicKey) {
      throw new Error('Klaviyo API key is required');
    }

    // Transform field data according to mappings
    const transformedData = Object.entries(fieldMapping).reduce(
      (acc, [contentfulField, klaviyoField]) => {
        if (entryData[contentfulField]) {
          // If this is a rich text field, use htmlValue if available
          if (
            isRichTextDocument(entryData[contentfulField].value) &&
            entryData[contentfulField].htmlValue
          ) {
            acc[klaviyoField] = entryData[contentfulField].htmlValue;
          } else {
            acc[klaviyoField] = entryData[contentfulField].value;
          }
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Endpoint defaults to template-universal-content if not specified
    const endpoint = config.endpoint || 'template-universal-content';
    const baseUrl = 'https://a.klaviyo.com/api';

    // Build request options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Klaviyo-API-Key ${config.publicKey}`,
      },
      body: JSON.stringify({
        data: transformedData,
        ...(config.listId && { list_id: config.listId }),
      }),
    };

    // Make the API request
    const response = await fetch(`${baseUrl}/${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Klaviyo API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error sending data to Klaviyo:', error);
    throw error;
  }
};

// Import the KlaviyoService and OAuth configuration
import { KlaviyoService } from './klaviyo';

// Helper function to check if a value is a Contentful rich text document
function isRichTextDocument(value: any): boolean {
  if (typeof value === 'string') {
    return value.includes('"nodeType":"document"');
  }

  return (
    value &&
    typeof value === 'object' &&
    (value.nodeType === 'document' ||
      (typeof value.content === 'string' && value.content.includes('"nodeType":"document"')) ||
      (Array.isArray(value.content) && value.content.length > 0))
  );
}

// Helper function to convert Contentful rich text to HTML
function richTextToHtml(richTextNode: any): string {
  if (!richTextNode) return '';

  try {
    // Handle string JSON case - parse it to an object
    if (typeof richTextNode === 'string') {
      try {
        richTextNode = JSON.parse(richTextNode);
      } catch (e) {
        return richTextNode; // Return original if not valid JSON
      }
    }

    // Special case for Contentful's locale-wrapped format like {"en-US": {...}}
    if (richTextNode && typeof richTextNode === 'object' && richTextNode['en-US']) {
      return richTextToHtml(richTextNode['en-US']);
    }

    // If content is a string that contains a serialized rich text document
    if (
      typeof richTextNode === 'object' &&
      typeof richTextNode.content === 'string' &&
      richTextNode.content.includes('"nodeType":"document"')
    ) {
      try {
        // Try to parse it as JSON
        richTextNode = JSON.parse(richTextNode.content);
      } catch (e) {
        return richTextNode.content;
      }
    }

    // If the content is already in the format shown in the example
    if (
      typeof richTextNode === 'object' &&
      !richTextNode.nodeType &&
      richTextNode.content &&
      Array.isArray(richTextNode.content)
    ) {
      // Create a document node containing the content array
      return richTextToHtml({
        nodeType: 'document',
        data: richTextNode.data || {},
        content: richTextNode.content,
      });
    }

    // Handle document node
    if (richTextNode.nodeType === 'document') {
      return richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
    }

    // Handle paragraph node
    if (richTextNode.nodeType === 'paragraph') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<p>${content}</p>`;
    }

    // Handle heading nodes
    if (richTextNode.nodeType === 'heading-1') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h1>${content}</h1>`;
    }
    if (richTextNode.nodeType === 'heading-2') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h2>${content}</h2>`;
    }
    if (richTextNode.nodeType === 'heading-3') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h3>${content}</h3>`;
    }
    if (richTextNode.nodeType === 'heading-4') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h4>${content}</h4>`;
    }
    if (richTextNode.nodeType === 'heading-5') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h5>${content}</h5>`;
    }
    if (richTextNode.nodeType === 'heading-6') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<h6>${content}</h6>`;
    }

    // Handle list nodes
    if (richTextNode.nodeType === 'unordered-list') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<ul>${content}</ul>`;
    }
    if (richTextNode.nodeType === 'ordered-list') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<ol>${content}</ol>`;
    }
    if (richTextNode.nodeType === 'list-item') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<li>${content}</li>`;
    }

    // Handle hyperlink
    if (richTextNode.nodeType === 'hyperlink') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<a href="${richTextNode.data?.uri || '#'}" ${
        richTextNode.data?.title ? `title="${richTextNode.data.title}"` : ''
      }>${content}</a>`;
    }

    // Handle text node
    if (richTextNode.nodeType === 'text') {
      let content = richTextNode.value || '';

      // Apply marks (bold, italic, etc.)
      if (richTextNode.marks && richTextNode.marks.length > 0) {
        for (const mark of richTextNode.marks) {
          if (mark.type === 'bold') {
            content = `<strong>${content}</strong>`;
          } else if (mark.type === 'italic') {
            content = `<em>${content}</em>`;
          } else if (mark.type === 'underline') {
            content = `<u>${content}</u>`;
          } else if (mark.type === 'code') {
            content = `<code>${content}</code>`;
          } else if (mark.type === 'superscript') {
            content = `<sup>${content}</sup>`;
          } else if (mark.type === 'subscript') {
            content = `<sub>${content}</sub>`;
          } else if (
            mark.type === 'strikethrough' ||
            mark.type === 'strike-through' ||
            mark.type === 'strike'
          ) {
            content = `<strike>${content}</strike>`;
          }
        }
      }

      return content;
    }

    // Handle hr/divider
    if (richTextNode.nodeType === 'hr') {
      return '<hr>';
    }

    // Handle blockquote
    if (richTextNode.nodeType === 'blockquote') {
      const content = richTextNode.content?.map((node: any) => richTextToHtml(node)).join('') || '';
      return `<blockquote>${content}</blockquote>`;
    }

    // Handle embedded entry or asset (skip or replace with placeholder)
    if (
      richTextNode.nodeType === 'embedded-entry-block' ||
      richTextNode.nodeType === 'embedded-asset-block' ||
      richTextNode.nodeType === 'embedded-entry-inline' ||
      richTextNode.nodeType === 'embedded-asset-inline'
    ) {
      return '[Embedded content]';
    }

    // Fallback for unhandled node types
    logger.warn(`Unhandled rich text node type: ${richTextNode.nodeType}`);

    // Last resort - if we can't convert it properly, return the stringified object
    if (typeof richTextNode === 'object') {
      return JSON.stringify(richTextNode);
    }

    return typeof richTextNode === 'string' ? richTextNode : '';
  } catch (error) {
    // Return the original value if conversion fails
    logger.error('Error converting rich text to HTML:', error);

    // If it's already a string, return it directly
    if (typeof richTextNode === 'string') {
      return richTextNode;
    }

    // Otherwise try to stringify the object
    try {
      return JSON.stringify(richTextNode);
    } catch (e) {
      return '';
    }
  }
}

/**
 * Class for syncing Contentful content to Klaviyo
 */
export class SyncContent {
  sdk: any;

  constructor(entry: any, sdk: any) {
    console.log('SyncContent constructor initialized', sdk, entry);
    logger.log('SyncContent constructor initialized');

    // Handle different initialization scenarios
    if (sdk) {
      // Case 1: Both entry and sdk are provided (new way)
      this.sdk = sdk;

      // If entry is a string, try to parse it
      if (typeof entry === 'string') {
        try {
          this.sdk.currentEntry = entry;
        } catch (e) {
          logger.error('[SyncContent] Error parsing entry string', e);
        }
      } else if (typeof entry === 'object') {
        // Store the entry object for later use
        this.sdk.currentEntry = JSON.stringify(entry);
      }
    } else if (entry) {
      if (entry.location && typeof entry.location.is === 'function') {
        // Case 2: Only sdk is provided in the entry parameter (old way)
        this.sdk = entry;

        // Try to get current entry from invocation parameters
        if (
          entry.parameters &&
          entry.parameters.invocation &&
          entry.parameters.invocation.currentEntry
        ) {
          this.sdk.currentEntry = entry.parameters.invocation.currentEntry;
        }
      } else {
        // Case 3: Direct entry data in entry parameter
        this.sdk = entry;
      }
    } else {
      // Case 4: Nothing provided
      this.sdk = {};
      logger.error('[SyncContent] No SDK or entry data provided');
    }
  }

  /**
   * Get entry data from the SDK
   * @param sdk The Contentful SDK
   * @returns The processed entry data
   */
  private async getEntryData(sdk: any): Promise<any> {
    try {
      if (!sdk) {
        throw new Error('SDK not available');
      }

      const entryData: Record<string, any> = {};

      // Check if we have a direct entry object (dialog context)
      if (this.sdk && typeof this.sdk !== 'function' && typeof this.sdk !== 'object') {
        logger.log('[SyncContent] Using direct entry data');
        // Direct entry data provided to constructor
        const directEntry = this.sdk;

        // Process fields in the direct entry data
        if (directEntry && directEntry.fields) {
          for (const fieldId in directEntry.fields) {
            try {
              const value = directEntry.fields[fieldId];
              entryData[fieldId] = {
                id: fieldId,
                name: fieldId,
                type: typeof value === 'object' ? 'Object' : typeof value,
                value: value,
                isAsset: value && value.sys && value.sys.linkType === 'Asset',
              };
            } catch (fieldError) {
              logger.error(`Error processing direct entry field ${fieldId}:`, fieldError);
            }
          }
          return entryData;
        }
      }

      // Try to get data from SDK entry (sidebar context)
      if (sdk.entry && sdk.entry.fields) {
        const entry = sdk.entry;

        // Process all fields in the entry
        for (const fieldId in entry.fields) {
          try {
            const field = entry.fields[fieldId];
            if (field) {
              let value;
              let fieldType;

              // Try to use getValue() but fall back to direct value if not available
              if (typeof field.getValue === 'function') {
                value = field.getValue();
                fieldType = field.type;
              } else if (field.type || field.id) {
                // Field object with properties but no getValue
                value = field.value || field;
                fieldType = field.type || 'Unknown';
              } else {
                // Raw value
                value = field;
                fieldType = typeof field === 'object' ? 'Object' : typeof field;
              }

              entryData[fieldId] = {
                id: fieldId,
                name: fieldId,
                type: fieldType || 'Unknown',
                value: value,
                isAsset: fieldType === 'Asset' || fieldType === 'Link',
              };

              // Process rich text if needed
              if (isRichTextDocument(value)) {
                entryData[fieldId].htmlValue = richTextToHtml(value);
                // Always set value to HTML string for rich text fields
                entryData[fieldId].value = entryData[fieldId].htmlValue;
              }

              // Process asset fields
              if (entryData[fieldId].isAsset && value && value.sys) {
                entryData[fieldId].assetDetails = await this.resolveAsset(sdk, value);
              }
            }
          } catch (fieldError) {
            logger.error(`Error processing field ${fieldId}:`, fieldError);
          }
        }

        return entryData;
      }

      // If we have entry data already available in the constructor or parameters
      if (sdk.currentEntry && typeof sdk.currentEntry === 'string') {
        try {
          const parsedEntry = JSON.parse(sdk.currentEntry);
          if (parsedEntry && parsedEntry.fields) {
            return this.processEntryFromCma(parsedEntry);
          }
        } catch (parseError) {
          logger.error('[SyncContent] Error parsing currentEntry:', parseError);
        }
      }

      // If we have direct fields in parameters invocation
      if (sdk.parameters && sdk.parameters.invocation && sdk.parameters.invocation.entryData) {
        const entryData = sdk.parameters.invocation.entryData;
        for (const fieldId in entryData) {
          try {
            const value = entryData[fieldId];
            entryData[fieldId] = {
              id: fieldId,
              name: fieldId,
              type: typeof value === 'object' ? 'Object' : typeof value,
              value: value,
              isAsset: value && value.sys && value.sys.linkType === 'Asset',
            };
          } catch (fieldError) {
            logger.error(`Error processing invocation field ${fieldId}:`, fieldError);
          }
        }
        return entryData;
      }

      logger.error('[SyncContent] Could not get entry data from any source');
      return {};
    } catch (error) {
      logger.error('[SyncContent] Error getting entry data from SDK:', error);
      throw error;
    }
  }

  /**
   * Process an entry from the Content Management API
   * @param entry The entry from the CMA
   * @returns The processed entry data
   */
  private processEntryFromCma(entry: any): any {
    try {
      if (!entry || !entry.fields) {
        throw new Error('Invalid entry data');
      }

      const entryData: Record<string, any> = {};

      // Process all fields in the entry
      for (const fieldId in entry.fields) {
        try {
          const fieldValue = entry.fields[fieldId];
          const localeValue = fieldValue['en-US'] || Object.values(fieldValue)[0]; // Default to first locale

          // Try to determine field type
          let fieldType = 'Text';
          let isAsset = false;

          if (localeValue && typeof localeValue === 'object') {
            if (localeValue.sys && localeValue.sys.type === 'Link') {
              fieldType = localeValue.sys.linkType || 'Link';
              isAsset = localeValue.sys.linkType === 'Asset';
            } else if (localeValue.nodeType === 'document') {
              fieldType = 'RichText';
            } else if (Array.isArray(localeValue)) {
              fieldType = 'Array';
            } else {
              fieldType = 'Object';
            }
          } else if (typeof localeValue === 'number') {
            fieldType = 'Number';
          } else if (typeof localeValue === 'boolean') {
            fieldType = 'Boolean';
          }

          entryData[fieldId] = {
            id: fieldId,
            name: fieldId, // Default name is the field ID
            type: fieldType,
            value: localeValue,
            isAsset: isAsset,
          };

          // Process rich text if needed
          if (isRichTextDocument(localeValue)) {
            entryData[fieldId].htmlValue = richTextToHtml(localeValue);
            // Always set value to HTML string for rich text fields
            entryData[fieldId].value = entryData[fieldId].htmlValue;
          }
        } catch (fieldError) {
          logger.error(`Error processing CMA field ${fieldId}:`, fieldError);
        }
      }

      return entryData;
    } catch (error) {
      logger.error('Error processing entry from CMA:', error);
      throw error;
    }
  }

  /**
   * Resolve asset details
   * @param sdk The Contentful SDK
   * @param assetLink The asset link object
   * @returns The resolved asset details
   */
  private async resolveAsset(sdk: any, assetLink: any): Promise<any[]> {
    try {
      if (
        !assetLink ||
        !assetLink.sys ||
        assetLink.sys.type !== 'Link' ||
        assetLink.sys.linkType !== 'Asset'
      ) {
        return [];
      }

      const assetId = assetLink.sys.id;

      // Always fetch the asset from the CMA
      if (sdk.space && typeof sdk.space.getAsset === 'function') {
        const asset = await sdk.space.getAsset(assetId);
        if (asset && asset.fields) {
          const title = asset.fields.title?.['en-US'] || '';
          const description = asset.fields.description?.['en-US'] || '';
          const file = asset.fields.file?.['en-US'];

          if (file && file.url) {
            // Ensure the URL is fully qualified
            const url = file.url.startsWith('//') ? `https:${file.url}` : file.url;
            return [
              {
                id: assetId,
                title,
                description,
                url,
                fileName: file.fileName,
                contentType: file.contentType,
              },
            ];
          }
        }
      }

      return [];
    } catch (error) {
      logger.error('Error resolving asset:', error);
      return [];
    }
  }

  /**
   * Get the Klaviyo API key from the SDK or environment
   * @param sdk The Contentful SDK
   * @returns The Klaviyo API key
   */
  private async getKlaviyoApiKey(sdk: any): Promise<string | undefined> {
    try {
      logger.log('[SyncContent] Attempting to get Klaviyo API key');

      // Check app installation parameters first
      if (sdk && sdk.parameters && sdk.parameters.installation) {
        const { klaviyoApiKey } = sdk.parameters.installation;
        if (klaviyoApiKey) {
          logger.log('[SyncContent] Found API key in SDK parameters');
          return klaviyoApiKey;
        }
      }

      // Check local storage under multiple possible keys
      const storageKeys = [
        'klaviyo_api_key',
        'klaviyoApiKey',
        'KLAVIYO_API_KEY',
        'klaviyo_private_key',
        'klaviyoPrivateKey',
      ];

      for (const key of storageKeys) {
        const storedKey = localStorage.getItem(key);
        if (storedKey) {
          logger.log(`[SyncContent] Found API key in localStorage with key: ${key}`);
          return storedKey;
        }
      }

      // Check if the SDK has direct invocation parameters (dialog context)
      if (sdk && sdk.parameters && sdk.parameters.invocation) {
        const invocation = sdk.parameters.invocation;

        // Check various potential parameter names
        const possibleKeyParams = ['privateKey', 'klaviyoApiKey', 'apiKey', 'klaviyo_api_key'];

        for (const param of possibleKeyParams) {
          if (invocation[param]) {
            logger.log(`[SyncContent] Found API key in invocation parameters: ${param}`);
            return invocation[param];
          }
        }
      }

      // If we have an app instance, try to get from secure app storage
      if (sdk && sdk.app && typeof sdk.app.getParameters === 'function') {
        try {
          const params = await sdk.app.getParameters();
          if (params && params.klaviyoApiKey) {
            logger.log('[SyncContent] Found API key in app parameters');
            return params.klaviyoApiKey;
          }
        } catch (e) {
          logger.error('[SyncContent] Error getting app parameters:', e);
        }
      }

      // Try to get from the configuration in localStorage
      try {
        const configStr = localStorage.getItem('klaviyo_config');
        if (configStr) {
          const config = JSON.parse(configStr);
          if (config && config.privateKey) {
            logger.log('[SyncContent] Found API key in klaviyo_config');
            return config.privateKey;
          }
        }
      } catch (e) {
        logger.error('[SyncContent] Error parsing config from localStorage:', e);
      }

      logger.error('[SyncContent] No Klaviyo API key found in any location');
      return undefined;
    } catch (error) {
      logger.error('[SyncContent] Error getting Klaviyo API key:', error);
      return undefined;
    }
  }

  /**
   * Helper function to extract text from localized field values
   * @param value The field value that might be in locale format like {"en-US": "value"}
   * @returns The extracted string value
   */
  private extractTextFromLocalizedField(value: any): string {
    // If it's null or undefined, return empty string
    if (value === null || value === undefined) {
      return '';
    }

    // If it's already a string, return it
    if (typeof value === 'string') {
      return value;
    }

    // If it's an object that might have locale keys like {"en-US": "Text Value"}
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Check if it has locale keys
      if ('en-US' in value) {
        return typeof value['en-US'] === 'string' ? value['en-US'] : String(value['en-US'] || '');
      }

      // Try the first key if it exists
      const keys = Object.keys(value);
      if (keys.length > 0) {
        const firstLocale = keys[0];
        return typeof value[firstLocale] === 'string'
          ? value[firstLocale]
          : String(value[firstLocale] || '');
      }
    }

    // Fallback: convert to string
    try {
      return String(value);
    } catch (e) {
      logger.error('Error converting value to string:', e);
      return '';
    }
  }

  /**
   * Format a location field value into a string with both coordinates
   * @param location Location field object or value
   * @returns Formatted string with lat/lon coordinates
   */
  private formatLocationField(location: any): string {
    if (!location) return '';

    // If it's already a string, return it
    if (typeof location === 'string') {
      return location;
    }

    // Check if it's a location object with lat/lon
    if (typeof location === 'object' && !Array.isArray(location)) {
      // Contentful location format has lat and lon properties
      if (location.lat !== undefined && location.lon !== undefined) {
        return `${location.lat},${location.lon}`;
      }

      // Alternative format might have latitude/longitude properties
      if (location.latitude !== undefined && location.longitude !== undefined) {
        return `${location.latitude},${location.longitude}`;
      }
    }

    // Return JSON string as fallback
    return JSON.stringify(location);
  }

  /**
   * Process entry data to ensure all field values are properly formatted
   * Handles localized fields, rich text, etc.
   * @param entryData The raw entry data
   * @param mappings Field mappings with type information
   * @returns Processed entry data with simplified values
   */
  private async processEntryData(
    entryData: Record<string, any>,
    mappings: Array<{ contentfulFieldId: string; klaviyoBlockName: string; fieldType: string }>
  ): Promise<Record<string, any>> {
    if (!entryData) {
      return {};
    }

    const processedData: Record<string, any> = {};

    // Process each field in the entry data
    for (const fieldId in entryData) {
      if (!entryData.hasOwnProperty(fieldId)) continue;

      let value = entryData[fieldId];

      // Handle wrapped field value objects (with value property)
      if (value && typeof value === 'object' && value.hasOwnProperty('value')) {
        value = value.value;
      }

      // Find the field mapping to determine type
      const mapping = mappings.find((m) => m.contentfulFieldId === fieldId);
      const fieldType = mapping?.fieldType || 'text';
      console.log(`[processEntryData] Field ${fieldId} type:`, fieldType);

      // Process based on field type
      if (fieldType === 'richText' && isRichTextDocument(value)) {
        // Always convert rich text to HTML for outgoing data
        logger.log(`[processEntryData] Converting rich text field ${fieldId} to HTML`);
        processedData[fieldId] = richTextToHtml(value);
      } else if (isRichTextDocument(value)) {
        // If fieldType is not set but value is rich text, also convert
        logger.log(
          `[processEntryData] Detected rich text in field ${fieldId} (no explicit type), converting to HTML`
        );
        processedData[fieldId] = richTextToHtml(value);
      } else if (fieldType === 'image') {
        let assetRef = value;
        console.log(
          `[processEntryData] Image field ${fieldId} value:`,
          value,
          this.sdk.space,
          this.sdk.cma
        );
        // If value is a string, try to parse as JSON asset reference
        if (typeof value === 'string') {
          try {
            logger.log(`[processEntryData] Attempting to parse image field ${fieldId} as JSON`);
            const parsed = JSON.parse(value);
            if (
              parsed &&
              parsed.sys &&
              parsed.sys.type === 'Link' &&
              parsed.sys.linkType === 'Asset'
            ) {
              assetRef = parsed;
              logger.log(`[processEntryData] Parsed asset reference for ${fieldId}:`, assetRef);
            }
          } catch (e) {
            logger.log(`[processEntryData] Could not parse image field ${fieldId} as JSON:`, e);
            // Not a JSON string, leave as is
          }
        }
        // If we have an asset reference, resolve it
        if (
          assetRef &&
          assetRef.sys &&
          assetRef.sys.type === 'Link' &&
          assetRef.sys.linkType === 'Asset'
        ) {
          try {
            logger.log(
              `[processEntryData] Resolving asset for field ${fieldId} with id ${assetRef.sys.id}`
            );
            const asset = await this.sdk.space.getAsset(assetRef.sys.id);
            const file = asset.fields.file?.['en-US'];
            if (file && file.url) {
              processedData[fieldId] = file.url.startsWith('//') ? `https:${file.url}` : file.url;
              logger.log(
                `[processEntryData] Resolved asset URL for ${fieldId}:`,
                processedData[fieldId]
              );
            } else {
              logger.error(
                `[processEntryData] Could not resolve file.url for asset ${assetRef.sys.id}`
              );
              processedData[fieldId] = '';
            }
          } catch (err) {
            logger.error(`[processEntryData] Error resolving asset for field ${fieldId}:`, err);
            processedData[fieldId] = '';
          }
        } else if (
          typeof assetRef === 'string' &&
          (assetRef.startsWith('http') || assetRef.startsWith('//'))
        ) {
          // Already a URL
          processedData[fieldId] = assetRef.startsWith('//') ? `https:${assetRef}` : assetRef;
          logger.log(
            `[processEntryData] Image field ${fieldId} is already a URL:`,
            processedData[fieldId]
          );
        } else {
          // Fallback: send empty string (lambda will skip)
          logger.error(
            `[processEntryData] Image field ${fieldId} is not a valid asset reference or URL. Sending empty string.`
          );
          processedData[fieldId] = '';
        }
      } else if (fieldType === 'location') {
        // Handle location field specially to ensure both coordinates are included
        logger.log(`[processEntryData] Formatting location field ${fieldId}`);
        processedData[fieldId] = this.formatLocationField(value);
      } else if (typeof value === 'string' && this.isLocationField(value)) {
        // Handle location fields (format: "lat,lng")
        logger.log(`[processEntryData] Formatting location field ${fieldId}`);
        processedData[fieldId] = this.formatLocationField(value);
      } else if (fieldType === 'json' || (typeof value === 'object' && !Array.isArray(value))) {
        // First try to extract text for localized objects
        const extractedText = this.extractTextFromLocalizedField(value);

        // If the extracted text is just [object Object], we need to stringify the object properly
        if (
          extractedText === '[object Object]' ||
          extractedText === '' ||
          extractedText === 'undefined'
        ) {
          logger.log(`[processEntryData] Stringifying JSON object for field ${fieldId}`);

          // Try to parse JSON if the value is a string that looks like a stringified object
          if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
            try {
              const parsedObj = JSON.parse(value);
              processedData[fieldId] = JSON.stringify(parsedObj, null, 2);
            } catch (e) {
              // If it's not valid JSON, just use the string as-is
              processedData[fieldId] = value;
            }
          } else {
            // For objects, stringify with formatting
            processedData[fieldId] = JSON.stringify(value, null, 2);
          }
        } else {
          // Use the extracted text
          processedData[fieldId] = extractedText;
        }
      } else {
        console.log(`[processEntryData] FieldType not found. Field ${fieldId} value:`, value);
        // Keep other values as-is
        processedData[fieldId] = value;
      }
    }

    return processedData;
  }

  /**
   * Check if a string value is a Contentful location field format
   * @param value String to check
   * @returns true if it's a location field
   */
  private isLocationField(value: string): boolean {
    // First try to check if it's just a latitude coordinate
    if (/^-?\d+\.\d+$/.test(value)) {
      return true;
    }

    // Check for "lat,lng" format (comma-separated coordinates)
    if (/^-?\d+\.\d+,-?\d+\.\d+$/.test(value)) {
      return true;
    }

    return false;
  }

  /**
   * Syncs content from Contentful to Klaviyo
   * @param sdk The Contentful SDK
   * @param mappings Field mappings defining how to map Contentful fields to Klaviyo
   * @param options Additional sync options
   * @returns Promise with the results of the sync operation
   */
  async syncContent(
    sdk: any,
    mappings: Array<{ contentfulFieldId: string; klaviyoBlockName: string; fieldType: string }>,
    options: SyncOptions = {}
  ) {
    if (!mappings || mappings.length === 0) {
      logger.error('[SyncContent] No field mappings provided');
      return {
        success: false,
        error: 'No field mappings provided',
      };
    }

    // Add additional validation to make sure mappings are properly structured
    const invalidMappings = mappings.filter(
      (mapping) => !mapping.contentfulFieldId || !mapping.klaviyoBlockName
    );

    if (invalidMappings.length > 0) {
      logger.error('[SyncContent] Invalid mappings found:', invalidMappings);
      return {
        success: false,
        error: 'Some field mappings are invalid (missing required properties)',
      };
    }

    logger.log('[SyncContent] Starting content sync with mappings:', mappings);

    try {
      // Extract entry ID and content type ID from params or SDK
      const entryId = options.entryId || (sdk.ids && sdk.ids.entry);
      const contentTypeId = options.contentTypeId || (sdk.ids && sdk.ids.contentType);

      if (!entryId || !contentTypeId) {
        logger.error('[SyncContent] Missing entry ID or content type ID');
        return {
          success: false,
          error: 'Missing entry ID or content type ID',
        };
      }

      // Get configuration settings
      const appConfig = (sdk.parameters && sdk.parameters.installation) || {};
      const { klaviyoApiKey, klaviyoCompanyId } = appConfig;

      // Fall back to secure storage if we don't have API key from app config
      if (!klaviyoApiKey) {
        logger.warn('[SyncContent] No API key in app config, checking secure storage');
      }

      // Get a populated entry object with all required fields
      let entryData: any = null;

      if (sdk.entry) {
        // First, try to read directly from the entry object provided by SDK
        try {
          entryData = await this.getEntryData(sdk);
          logger.log('[SyncContent] Got entry data from SDK:', Object.keys(entryData));
        } catch (error) {
          logger.error('[SyncContent] Error getting entry data from SDK:', error);
          entryData = null;
        }
      }

      if (!entryData || Object.keys(entryData).length === 0) {
        // If that fails, use the content management API to fetch the entry
        try {
          if (sdk.cma) {
            logger.log(`[SyncContent] Fetching entry ${entryId} from CMA`);
            const entry = await sdk.cma.entry.get({ entryId });
            entryData = this.processEntryFromCma(entry);
            logger.log('[SyncContent] Got entry data from CMA:', Object.keys(entryData));
          } else {
            // Try to use direct entry if provided in constructor
            entryData = await this.getEntryData(this.sdk);
            if (entryData && Object.keys(entryData).length > 0) {
              logger.log('[SyncContent] Got entry data from constructor:', Object.keys(entryData));
            } else {
              logger.error('[SyncContent] CMA not available and no entry data found');
              return {
                success: false,
                error: 'No entry data available from any source',
              };
            }
          }
        } catch (fetchError) {
          logger.error('[SyncContent] Error fetching entry from CMA:', fetchError);
          return {
            success: false,
            error: `Error fetching entry: ${
              fetchError instanceof Error ? fetchError.message : 'Unknown error'
            }`,
          };
        }
      }

      // Final check for entry data
      if (!entryData || Object.keys(entryData).length === 0) {
        logger.error('[SyncContent] No entry data available after all attempts');
        return {
          success: false,
          error: 'No entry data available',
        };
      }

      try {
        // Prepare parameters for the legacy proxy
        const klaviyoApiKey = await this.getKlaviyoApiKey(sdk);

        if (!klaviyoApiKey) {
          logger.error('[SyncContent] No Klaviyo API key available');
          return {
            success: false,
            error: 'Klaviyo API key is required',
          };
        }

        // Prepare payload for the proxy
        const spaceId = getEffectiveSpaceId(sdk); // Use your helper

        const payload = {
          action: 'syncEntry',
          data: {
            entryId,
            contentTypeId,
            entryData: {},
            fieldMappings: mappings,
            spaceId, // <-- ADD THIS LINE
          },
          privateKey: klaviyoApiKey,
          publicKey: klaviyoCompanyId,
        };

        // Process the entry data to ensure all fields are properly formatted
        if (entryData) {
          payload.data.entryData = await this.processEntryData(entryData, mappings);
          logger.log(
            '[SyncContent] Processed entry data for payload:',
            Object.keys(payload.data.entryData).length,
            'fields:',
            Object.keys(payload.data.entryData).join(', ')
          );
        }
        // If we still don't have entry data and this.sdk has entryData, use that
        else if (this.sdk && this.sdk.entryData) {
          payload.data.entryData = await this.processEntryData(this.sdk.entryData, mappings);
          logger.log(
            '[SyncContent] Using processed SDK entry data:',
            Object.keys(payload.data.entryData).length,
            'fields'
          );
        }

        logger.log('[SyncContent] Prepared sync payload:', {
          action: payload.action,
          entryId: payload.data.entryId,
          contentTypeId: payload.data.contentTypeId,
          fieldMappingsCount: payload.data.fieldMappings.length,
          entryDataFields: Object.keys(payload.data.entryData),
        });

        // Use our Klaviyo service to send the request
        const klaviyoService = new KlaviyoService({
          publicKey: klaviyoCompanyId || '',
          privateKey: klaviyoApiKey || '',
        });
        const result = await klaviyoService.proxy(payload);

        if (result && result.success) {
          logger.log('[SyncContent] Sync successful');

          // Update sync status
          if (options.useSdk) {
            await this.updateSyncStatusWithSdkSimple(contentTypeId, '', true);
          } else {
            this.updateSyncStatusSimple(contentTypeId, '', true);
          }

          return {
            success: true,
            message: 'Content synced successfully',
            data: result.data,
          };
        } else {
          // Success was false or result was invalid
          logger.error('[SyncContent] Sync failed with result:', result);
          return {
            success: false,
            error: result?.error || 'Unknown error during sync',
          };
        }
      } catch (syncError) {
        logger.error('[SyncContent] Error during sync:', syncError);
        return {
          success: false,
          error: syncError instanceof Error ? syncError.message : 'Unknown error during sync',
        };
      }
    } catch (error) {
      logger.error('[SyncContent] Unexpected error in syncContent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error during sync',
      };
    }
  }

  // Simplified method that doesn't require entry.sys
  private async updateSyncStatusSimple(
    contentTypeId: string,
    contentTypeName: string,
    synced: boolean = true
  ) {
    try {
      if (!this.sdk) {
        logger.error('Cannot update sync status: No SDK available');
        return;
      }

      const entryId = this.sdk.ids?.entry;

      if (!entryId) {
        logger.error('Cannot update sync status: No entry ID available from SDK');
        return;
      }

      // Use SDK if available to update status
      if (this.sdk && this.sdk.app) {
        await this.updateSyncStatusWithSdkSimple(contentTypeId, contentTypeName, synced);
      } else {
        // Fall back to localStorage
        this.updateSyncStatusWithLocalStorageSimple(
          entryId,
          contentTypeId,
          contentTypeName,
          synced
        );
      }
    } catch (error) {
      logger.error('Error updating sync status:', error);
    }
  }

  // Updated version that doesn't require entry.sys
  private async updateSyncStatusWithSdkSimple(
    contentTypeId: string,
    contentTypeName: string,
    synced: boolean = true
  ) {
    try {
      if (!this.sdk || !this.sdk.app || !this.sdk.ids?.entry) {
        logger.error('Cannot update sync status with SDK: Missing SDK or entry ID');
        return;
      }

      const entryId = this.sdk.ids.entry;

      // Get parameters from SDK
      const parameters = await this.sdk.app.getParameters();

      // Initialize sync data structure if not present
      const syncData: SyncParameters = parameters?.syncData || {
        syncStatuses: [],
        lastUpdated: Date.now(),
      };

      // Check if entry already has a status
      const statusIndex = syncData.syncStatuses.findIndex(
        (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
      );

      if (statusIndex >= 0) {
        // Update existing status
        if (synced) {
          syncData.syncStatuses[statusIndex].lastSynced = Date.now();
          syncData.syncStatuses[statusIndex].syncCompleted = true;
          syncData.syncStatuses[statusIndex].needsSync = false;
        } else {
          // Mark as needing sync
          syncData.syncStatuses[statusIndex].needsSync = true;
        }
      } else {
        // Add new status
        syncData.syncStatuses.push({
          entryId,
          contentTypeId,
          contentTypeName,
          lastSynced: synced ? Date.now() : 0,
          needsSync: !synced,
          syncCompleted: synced,
        });
      }

      // Update timestamp
      syncData.lastUpdated = Date.now();

      // Save back to instance parameters
      await this.sdk.app.setParameters({
        ...parameters,
        syncData,
      });

      // If sync was successful, trigger a sync event
      if (synced) {
        window.dispatchEvent(
          new CustomEvent('klaviyo-sync-completed', {
            detail: { entryId, contentTypeId },
          })
        );
      }
    } catch (error) {
      logger.error('Error updating sync status with SDK:', error);

      // Fall back to localStorage if SDK fails
      if (this.sdk?.ids?.entry) {
        this.updateSyncStatusWithLocalStorageSimple(
          this.sdk.ids.entry,
          contentTypeId,
          contentTypeName,
          synced
        );
      }
    }
  }

  // Updated version that takes entryId as a parameter
  private updateSyncStatusWithLocalStorageSimple(
    entryId: string,
    contentTypeId: string,
    contentTypeName: string,
    synced: boolean = true
  ) {
    try {
      const storageKey = 'klaviyo_sync_status';

      // Get existing statuses
      const statusesStr = localStorage.getItem(storageKey);
      let statuses: SyncStatus[] = [];

      if (statusesStr) {
        statuses = JSON.parse(statusesStr);
      }

      // Check if entry already has a status
      const statusIndex = statuses.findIndex(
        (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
      );

      if (statusIndex >= 0) {
        // Update existing status
        if (synced) {
          statuses[statusIndex].lastSynced = Date.now();
          statuses[statusIndex].syncCompleted = true;
          statuses[statusIndex].needsSync = false;
        } else {
          // Mark as needing sync
          statuses[statusIndex].needsSync = true;
        }
      } else {
        // Add new status
        statuses.push({
          entryId,
          contentTypeId,
          contentTypeName,
          lastSynced: synced ? Date.now() : 0,
          needsSync: !synced,
          syncCompleted: synced,
        });
      }

      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(statuses));

      // If sync was successful, trigger a sync event
      if (synced) {
        window.dispatchEvent(
          new CustomEvent('klaviyo-sync-completed', {
            detail: { entryId, contentTypeId },
          })
        );
      }
    } catch (error) {
      logger.error('Error updating sync status with localStorage:', error);
    }
  }
}

// Add this function to manage sync status
export const updateSyncStatus = (
  entryId: string,
  contentTypeId: string,
  fields: Record<string, number> = {},
  sdk?: any
): void => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      updateSyncStatusWithSdk(sdk, entryId, contentTypeId, fields);
      return;
    }

    // Fallback to localStorage
    updateSyncStatusWithLocalStorage(entryId, contentTypeId, fields);
  } catch (error) {
    logger.error('Error updating sync status:', error);
  }
};

/**
 * Update sync status using Contentful's instance parameters
 */
export const updateSyncStatusWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  fields: Record<string, number> = {}
): Promise<void> => {
  try {
    // Get parameters from SDK
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };

    // Get the entry to store its version
    let entryVersion: number | undefined;
    try {
      const entry = await sdk.space.getEntry(entryId);
      if (entry && entry.sys) {
        entryVersion = entry.sys.version;
      }
    } catch (err) {
      logger.error('Failed to get entry version:', err);
      // Continue anyway without version info
    }

    // Find this entry's status
    const existingIndex = syncData.syncStatuses.findIndex(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (existingIndex >= 0) {
      // Update existing status
      syncData.syncStatuses[existingIndex].lastSynced = Date.now();
      syncData.syncStatuses[existingIndex].syncCompleted = true;
      syncData.syncStatuses[existingIndex].needsSync = false;

      // Add version info if available
      if (entryVersion !== undefined) {
        syncData.syncStatuses[existingIndex].lastSyncedVersion = entryVersion;
      }

      // Update field timestamps if provided
      if (Object.keys(fields).length > 0) {
        syncData.syncStatuses[existingIndex].fieldsUpdatedAt = {
          ...(syncData.syncStatuses[existingIndex].fieldsUpdatedAt || {}),
          ...fields,
        };
      }
    } else {
      // Create new status
      syncData.syncStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: Date.now(),
        fieldsUpdatedAt: fields,
        needsSync: false,
        syncCompleted: true,
        lastSyncedVersion: entryVersion,
      });
    }

    // Update timestamp and save back to instance parameters
    syncData.lastUpdated = Date.now();
    await sdk.app.setParameters({
      ...parameters,
      syncData,
    });

    logger.log('Updated sync status with SDK for entry', entryId);
  } catch (error) {
    logger.error('Error updating sync status with SDK:', error);
    // Fall back to localStorage for robustness
    updateSyncStatusWithLocalStorage(entryId, contentTypeId, fields);
  }
};

/**
 * Update sync status using localStorage (fallback method)
 */
export const updateSyncStatusWithLocalStorage = (
  entryId: string,
  contentTypeId: string,
  fields: Record<string, number> = {},
  entryVersion?: number
): void => {
  try {
    const storageKey = 'klaviyo_sync_status';
    const statusesStr = localStorage.getItem(storageKey);
    let statuses: SyncStatus[] = [];

    if (statusesStr) {
      statuses = JSON.parse(statusesStr);
    }

    // Find existing status for this entry
    const existingIndex = statuses.findIndex(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (existingIndex >= 0) {
      // Update existing status
      statuses[existingIndex].lastSynced = Date.now();
      statuses[existingIndex].syncCompleted = true;
      statuses[existingIndex].needsSync = false;

      // Add version info if available
      if (entryVersion !== undefined) {
        statuses[existingIndex].lastSyncedVersion = entryVersion;
      }

      // Update field timestamps if provided
      if (Object.keys(fields).length > 0) {
        statuses[existingIndex].fieldsUpdatedAt = {
          ...(statuses[existingIndex].fieldsUpdatedAt || {}),
          ...fields,
        };
      }
    } else {
      // Create new status
      statuses.push({
        entryId,
        contentTypeId,
        lastSynced: Date.now(),
        fieldsUpdatedAt: fields,
        needsSync: false,
        syncCompleted: true,
        lastSyncedVersion: entryVersion,
      });
    }

    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(statuses));
    logger.log('Updated sync status with localStorage for entry', entryId);

    // Clear the cache
    localStorage.removeItem(`${storageKey}_cache`);
  } catch (error) {
    logger.error('Error updating sync status with localStorage:', error);
  }
};

// Add this function to check if an entry needs syncing
export const checkNeedsSync = async (
  entryId: string,
  contentTypeId: string,
  fieldsUpdatedAt: Record<string, number>,
  sdk?: any
): Promise<boolean> => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      return await checkNeedsSyncWithSdk(sdk, entryId, contentTypeId, fieldsUpdatedAt);
    }

    // Fallback to localStorage
    return checkNeedsSyncWithLocalStorage(entryId, contentTypeId, fieldsUpdatedAt);
  } catch (error) {
    logger.error('Error checking sync status:', error);
    return true; // Default to needs sync if there's an error
  }
};

/**
 * Check if an entry needs syncing using Contentful's instance parameters
 */
export const checkNeedsSyncWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  fieldsUpdatedAt: Record<string, number>
): Promise<boolean> => {
  try {
    // Get parameters from SDK
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };

    // Find this entry's status
    const existingStatus = syncData.syncStatuses.find(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (!existingStatus) {
      // Never synced before, so it needs sync
      return true;
    }

    // Check if any fields have been updated since last sync
    let needsSync = false;

    for (const [fieldId, updatedAt] of Object.entries(fieldsUpdatedAt)) {
      // If this field has been updated since last sync
      if (updatedAt > existingStatus.lastSynced) {
        needsSync = true;
        break;
      }
    }

    // Update the status if needed
    if (needsSync) {
      const statusIndex = syncData.syncStatuses.findIndex(
        (s) => s.entryId === entryId && s.contentTypeId === contentTypeId
      );

      if (statusIndex >= 0) {
        syncData.syncStatuses[statusIndex].needsSync = true;

        // Save updated status back to instance parameters
        await sdk.app.setParameters({
          ...parameters,
          syncData: {
            ...syncData,
            lastUpdated: Date.now(),
          },
        });
      }
    }

    return needsSync;
  } catch (error) {
    logger.error('Error checking sync status with SDK:', error);
    // Fall back to localStorage if SDK check fails
    return checkNeedsSyncWithLocalStorage(entryId, contentTypeId, fieldsUpdatedAt);
  }
};

/**
 * Check if an entry needs syncing using localStorage (fallback method)
 */
export const checkNeedsSyncWithLocalStorage = (
  entryId: string,
  contentTypeId: string,
  fieldsUpdatedAt: Record<string, number>
): boolean => {
  try {
    // Get existing sync statuses
    const storageKey = 'klaviyo_sync_status';
    const existingStatusesJson = localStorage.getItem(storageKey);
    const existingStatuses: SyncStatus[] = existingStatusesJson
      ? JSON.parse(existingStatusesJson)
      : [];

    // Find this entry's status
    const existingStatus = existingStatuses.find(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (!existingStatus) {
      // Never synced before, so it needs sync
      return true;
    }

    // Check if any fields have been updated since last sync
    let needsSync = false;

    for (const [fieldId, updatedAt] of Object.entries(fieldsUpdatedAt)) {
      // If this field has been updated since last sync
      if (updatedAt > existingStatus.lastSynced) {
        needsSync = true;
        break;
      }
    }

    // Update the status if needed
    if (needsSync) {
      const statuses = [...existingStatuses];
      const statusIndex = statuses.findIndex(
        (s) => s.entryId === entryId && s.contentTypeId === contentTypeId
      );

      if (statusIndex >= 0) {
        statuses[statusIndex].needsSync = true;
        localStorage.setItem(storageKey, JSON.stringify(statuses));
      }
    }

    return needsSync;
  } catch (error) {
    logger.error('Error checking sync status with localStorage:', error);
    return true; // Default to needs sync if there's an error
  }
};

// Add this function to get all sync statuses
export const getAllSyncStatuses = async (
  forceRefresh: boolean = false,
  sdk?: any
): Promise<SyncStatus[]> => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      return await getAllSyncStatusesWithSdk(sdk, forceRefresh);
    }

    // Fallback to localStorage
    return getAllSyncStatusesWithLocalStorage(forceRefresh);
  } catch (error) {
    logger.error('Error getting sync statuses:', error);
    return [];
  }
};

/**
 * Get all sync statuses using Contentful's instance parameters
 */
export const getAllSyncStatusesWithSdk = async (
  sdk: any,
  forceRefresh: boolean = false
): Promise<SyncStatus[]> => {
  try {
    // Use a cache key to avoid excessive API calls
    const cacheKey = 'klaviyo_sync_status_cache';

    // Check cache if not forcing refresh
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { timestamp, statuses } = JSON.parse(cachedData);
        // Use cache if it's less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return statuses;
        }
      }
    }

    // Try to get data from localStorage first (most up-to-date in sidebar context)
    const localStorageKey = 'klaviyo_sync_status';
    const localData = localStorage.getItem(localStorageKey);
    let localStatuses: SyncStatus[] = [];

    if (localData) {
      try {
        localStatuses = JSON.parse(localData);
        logger.log('Loaded sync statuses from localStorage:', localStatuses.length);
      } catch (e) {
        logger.error('Error parsing localStorage data:', e);
      }
    }

    // Also try to get parameters from SDK
    let paramStatuses: SyncStatus[] = [];

    try {
      // Get parameters from SDK
      const parameters = await sdk.app.getParameters();
      const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };
      paramStatuses = syncData.syncStatuses || [];
      logger.log('Loaded sync statuses from parameters:', paramStatuses.length);
    } catch (e) {
      logger.error('Error getting sync statuses from parameters:', e);
    }

    // Merge the two sets of statuses, preferring localStorage (more recent) for duplicates
    const mergedStatuses: SyncStatus[] = [...paramStatuses];

    for (const localStatus of localStatuses) {
      const existingIndex = mergedStatuses.findIndex(
        (s) => s.entryId === localStatus.entryId && s.contentTypeId === localStatus.contentTypeId
      );

      if (existingIndex >= 0) {
        // Local data is more recent - replace
        mergedStatuses[existingIndex] = localStatus;
      } else {
        // New status - add
        mergedStatuses.push(localStatus);
      }
    }

    // Cache the result
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        timestamp: Date.now(),
        statuses: mergedStatuses,
      })
    );

    return mergedStatuses;
  } catch (error) {
    logger.error('Error getting sync statuses with SDK:', error);
    // Fall back to localStorage if SDK fails
    return getAllSyncStatusesWithLocalStorage(forceRefresh);
  }
};

/**
 * Get all sync statuses using localStorage (fallback method)
 */
export const getAllSyncStatusesWithLocalStorage = (forceRefresh: boolean = false): SyncStatus[] => {
  try {
    const storageKey = 'klaviyo_sync_status';
    const statusesStr = localStorage.getItem(storageKey);

    // Clear cache if force refresh is requested
    if (forceRefresh) {
      localStorage.removeItem(`${storageKey}_cache`);
    }

    if (!statusesStr) return [];

    const statuses = JSON.parse(statusesStr);
    logger.log('getAllSyncStatusesWithLocalStorage found', statuses.length, 'statuses');
    return statuses;
  } catch (error) {
    logger.error('Error getting sync statuses with localStorage:', error);
    return [];
  }
};

// Add this function to mark an entry as needing sync
export const markEntryForSync = async (
  entryId: string,
  contentTypeId: string,
  contentTypeName?: string,
  sdk?: any
): Promise<void> => {
  try {
    // If SDK is provided, try to use Contentful's instance parameters
    if (sdk && sdk.app) {
      await markEntryForSyncWithSdk(sdk, entryId, contentTypeId, contentTypeName);
      return;
    }

    // Fallback to localStorage
    markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
  } catch (error) {
    logger.error('Error marking entry for sync:', error);
  }
};

/**
 * Mark an entry as needing sync using Contentful's instance parameters
 */
export const markEntryForSyncWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  contentTypeName?: string
): Promise<void> => {
  try {
    // Get parameters from SDK
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };

    // Find this entry's status
    const existingIndex = syncData.syncStatuses.findIndex(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (existingIndex >= 0) {
      // Update existing status
      syncData.syncStatuses[existingIndex].needsSync = true;
      if (contentTypeName) {
        syncData.syncStatuses[existingIndex].contentTypeName = contentTypeName;
      }
    } else {
      // Add new status
      syncData.syncStatuses.push({
        entryId,
        contentTypeId,
        contentTypeName,
        lastSynced: 0, // Never synced
        needsSync: true,
        syncCompleted: false,
      });
    }

    // Update timestamp and save back to instance parameters
    syncData.lastUpdated = Date.now();
    await sdk.app.setParameters({
      ...parameters,
      syncData,
    });
  } catch (error) {
    logger.error('Error marking entry for sync with SDK:', error);
    // Fall back to localStorage if SDK fails
    markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
  }
};

/**
 * Mark an entry as needing sync using localStorage (fallback method)
 */
export const markEntryForSyncWithLocalStorage = (
  entryId: string,
  contentTypeId: string,
  contentTypeName?: string
): void => {
  try {
    // Get existing sync statuses
    const storageKey = 'klaviyo_sync_status';
    const existingStatusesJson = localStorage.getItem(storageKey);
    const existingStatuses: SyncStatus[] = existingStatusesJson
      ? JSON.parse(existingStatusesJson)
      : [];

    // Find this entry's status
    const existingIndex = existingStatuses.findIndex(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (existingIndex >= 0) {
      // Update existing status
      existingStatuses[existingIndex].needsSync = true;
      if (contentTypeName) {
        existingStatuses[existingIndex].contentTypeName = contentTypeName;
      }
    } else {
      // Add new status
      existingStatuses.push({
        entryId,
        contentTypeId,
        contentTypeName,
        lastSynced: 0, // Never synced
        needsSync: true,
        syncCompleted: false,
      });
    }

    // Save back to localStorage
    localStorage.setItem(storageKey, JSON.stringify(existingStatuses));
  } catch (error) {
    logger.error('Error marking entry for sync with localStorage:', error);
  }
};

/**
 * Sets up a listener to track field changes and determine if an entry needs syncing
 * @param sdk The Contentful SDK
 * @param syncedFields Array of field IDs that are synced with Klaviyo
 * @param options Additional options for sync behavior
 * @returns Cleanup function to remove listeners
 */
export const setupEntryChangeListener = (
  sdk: any,
  syncedFields: string[],
  options: SyncOptions = {}
): (() => void) => {
  if (!sdk || !sdk.entry || !Array.isArray(syncedFields)) {
    logger.error('Invalid SDK or synced fields for change listener');
    return () => {}; // Return empty cleanup function
  }

  logger.log(`Setting up change listeners for ${syncedFields.length} fields`);

  // Get entry ID and content type info
  let entryId: string;
  let contentTypeId: string;
  let contentTypeName = '';

  try {
    // Try to get IDs from different sources
    if (sdk.ids) {
      entryId = sdk.ids.entry;
      contentTypeId = sdk.ids.contentType;
    } else if (typeof sdk.entry.getSys === 'function') {
      const entrySys = sdk.entry.getSys();
      entryId = entrySys.id;
      contentTypeId = entrySys.contentType?.sys?.id;
    } else if (sdk.entry && 'sys' in sdk.entry) {
      const entrySys = (sdk.entry as any).sys;
      entryId = entrySys.id;
      contentTypeId = entrySys.contentType?.sys?.id;
    } else {
      logger.error('Unable to determine entry ID or content type ID');
      return () => {}; // Exit early if we can't get necessary IDs
    }

    contentTypeName = sdk.contentType?.name || '';
  } catch (error) {
    logger.error('Error getting entry IDs:', error);
    return () => {}; // Exit if we can't get IDs
  }

  // Initialize field trackers
  const fieldTrackers: Record<string, FieldChangeTracker> = {};

  // Store current sync status
  let syncStatus: SyncStatus | undefined;
  let lastSyncTimestamp = 0;

  // Get initial sync status
  (async () => {
    try {
      // Try to get sync status from Contentful if SDK is present and useSdk option is true
      if (options.useSdk && sdk.app) {
        const statuses = await getAllSyncStatusesWithSdk(sdk);
        syncStatus = statuses.find(
          (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
        );
      } else {
        // Fallback to localStorage
        syncStatus = getSyncStatusForEntryWithLocalStorage(entryId, contentTypeId);
      }

      lastSyncTimestamp = syncStatus?.lastSynced || 0;
      logger.log(
        `Initial sync status for ${entryId}: last synced at ${new Date(
          lastSyncTimestamp
        ).toISOString()}`
      );
    } catch (error) {
      logger.error('Error getting initial sync status:', error);
    }
  })();

  // Initialize field values
  for (const fieldId of syncedFields) {
    try {
      const field = sdk.entry.fields[fieldId];
      if (field) {
        const currentValue = field.getValue();

        fieldTrackers[fieldId] = {
          fieldId,
          lastModified: Date.now(),
          originalValue: JSON.stringify(currentValue),
          currentValue: JSON.stringify(currentValue),
        };

        logger.log(`Initialized tracker for field ${fieldId}`);
      }
    } catch (error) {
      logger.error(`Error initializing tracker for field ${fieldId}:`, error);
    }
  }

  // Array to store cleanup functions
  const cleanupFunctions: (() => void)[] = [];

  // Set up change listeners for each field
  for (const fieldId of syncedFields) {
    try {
      const field = sdk.entry.fields[fieldId];
      if (field) {
        // Listen for value changes
        const removeValueListener = field.onValueChanged((value: any) => {
          logger.log(`Field ${fieldId} value changed`);

          const stringifiedValue = JSON.stringify(value);
          const tracker = fieldTrackers[fieldId];

          if (tracker) {
            // Update tracker
            tracker.lastModified = Date.now();
            tracker.currentValue = stringifiedValue;

            // Check if value actually changed (not just metadata)
            const valueChanged = tracker.originalValue !== stringifiedValue;

            if (valueChanged) {
              logger.log(`Field ${fieldId} content changed, marking for sync`);

              // Update field timestamps in sync status
              const fieldsUpdatedAt: Record<string, number> = {
                [fieldId]: tracker.lastModified,
              };

              // Mark entry for sync using appropriate method
              if (options.useSdk && sdk.app) {
                markEntryForSyncWithSdk(sdk, entryId, contentTypeId, contentTypeName);
                updateFieldTimestampsWithSdk(sdk, entryId, contentTypeId, fieldsUpdatedAt);
              } else {
                markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
                updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, fieldsUpdatedAt);
              }
            } else {
              logger.log(`Field ${fieldId} metadata changed but content is the same`);
            }
          }
        });

        cleanupFunctions.push(removeValueListener);
      }
    } catch (error) {
      logger.error(`Error setting up change listener for field ${fieldId}:`, error);
    }
  }

  // Also listen for entry saves to check all fields
  try {
    const removeSysListener = sdk.entry.onSysChanged((sys: any) => {
      logger.log('Entry sys changed, checking if sync is needed');

      // Only check on published or updated states
      if (sys.version && (sys.publishedVersion || sys.updatedAt)) {
        checkAndMarkForSync(
          sdk,
          syncedFields,
          fieldTrackers,
          entryId,
          contentTypeId,
          contentTypeName,
          options
        );
      }
    });

    cleanupFunctions.push(removeSysListener);
  } catch (error) {
    logger.error('Error setting up sys change listener:', error);
  }

  // Return a cleanup function that removes all listeners
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    logger.log('Removed all field change listeners');
  };
};

/**
 * Helper function to check all tracked fields and mark for sync if needed
 */
const checkAndMarkForSync = async (
  sdk: any,
  syncedFields: string[],
  fieldTrackers: Record<string, FieldChangeTracker>,
  entryId: string,
  contentTypeId: string,
  contentTypeName: string,
  options: SyncOptions = {}
) => {
  try {
    // Get current sync status
    let syncStatus: SyncStatus | undefined;

    if (options.useSdk && sdk.app) {
      // Get sync status from SDK
      const statuses = await getAllSyncStatusesWithSdk(sdk);
      syncStatus = statuses.find(
        (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
      );
    } else {
      // Get sync status from localStorage
      syncStatus = getSyncStatusForEntryWithLocalStorage(entryId, contentTypeId);
    }

    const lastSyncTimestamp = syncStatus?.lastSynced || 0;

    // Track which fields have changed
    const changedFields: Record<string, number> = {};
    let hasChanges = false;

    // Check each field
    for (const fieldId of syncedFields) {
      try {
        const field = sdk.entry.fields[fieldId];
        if (field) {
          const currentValue = field.getValue();
          const tracker = fieldTrackers[fieldId];

          if (tracker) {
            const stringifiedValue = JSON.stringify(currentValue);

            // Check if different from original value
            if (stringifiedValue !== tracker.originalValue) {
              tracker.currentValue = stringifiedValue;
              tracker.lastModified = Date.now();
              changedFields[fieldId] = tracker.lastModified;
              hasChanges = true;

              logger.log(`Field ${fieldId} has changed since original state`);
            }

            // Check if field has changed since last sync
            if (tracker.lastModified > lastSyncTimestamp) {
              hasChanges = true;
              changedFields[fieldId] = tracker.lastModified;
              logger.log(
                `Field ${fieldId} changed since last sync at ${new Date(
                  lastSyncTimestamp
                ).toISOString()}`
              );
            }
          }
        }
      } catch (error) {
        logger.error(`Error checking field ${fieldId}:`, error);
      }
    }

    // If any fields have changed, mark for sync
    if (hasChanges) {
      logger.log('Changes detected, marking entry for sync');

      if (options.useSdk && sdk.app) {
        await markEntryForSyncWithSdk(sdk, entryId, contentTypeId, contentTypeName);
        await updateFieldTimestampsWithSdk(sdk, entryId, contentTypeId, changedFields);
      } else {
        markEntryForSyncWithLocalStorage(entryId, contentTypeId, contentTypeName);
        updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, changedFields);
      }
    } else {
      logger.log('No changes detected that need syncing');
    }
  } catch (error) {
    logger.error('Error checking fields for changes:', error);
  }
};

/**
 * Helper function to get sync status for a specific entry
 */
const getSyncStatusForEntry = async (
  entryId: string,
  contentTypeId: string,
  sdk?: any
): Promise<SyncStatus | undefined> => {
  try {
    if (sdk && sdk.app) {
      const allStatuses = await getAllSyncStatusesWithSdk(sdk);
      return allStatuses.find(
        (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
      );
    } else {
      return getSyncStatusForEntryWithLocalStorage(entryId, contentTypeId);
    }
  } catch (error) {
    logger.error('Error getting sync status for entry:', error);
    return undefined;
  }
};

/**
 * Helper function to get sync status for a specific entry using localStorage
 */
const getSyncStatusForEntryWithLocalStorage = (
  entryId: string,
  contentTypeId: string
): SyncStatus | undefined => {
  try {
    const allStatuses = getAllSyncStatusesWithLocalStorage();
    return allStatuses.find(
      (status) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );
  } catch (error) {
    logger.error('Error getting sync status for entry with localStorage:', error);
    return undefined;
  }
};

/**
 * Helper function to update timestamp information for specific fields
 */
const updateFieldTimestamps = async (
  entryId: string,
  contentTypeId: string,
  fieldTimestamps: Record<string, number>,
  sdk?: any
): Promise<void> => {
  try {
    if (sdk && sdk.app) {
      await updateFieldTimestampsWithSdk(sdk, entryId, contentTypeId, fieldTimestamps);
    } else {
      updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, fieldTimestamps);
    }
  } catch (error) {
    logger.error('Error updating field timestamps:', error);
  }
};

/**
 * Helper function to update timestamp information for specific fields using SDK
 */
const updateFieldTimestampsWithSdk = async (
  sdk: any,
  entryId: string,
  contentTypeId: string,
  fieldTimestamps: Record<string, number>
): Promise<void> => {
  try {
    // Get current parameters
    const parameters = await sdk.app.getParameters();
    const syncData: SyncParameters = parameters?.syncData || { syncStatuses: [], lastUpdated: 0 };

    const statusIndex = syncData.syncStatuses.findIndex(
      (status: SyncStatus) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (statusIndex >= 0) {
      // Update existing status with field timestamps
      const currentFieldTimestamps = syncData.syncStatuses[statusIndex].fieldsUpdatedAt || {};
      syncData.syncStatuses[statusIndex].fieldsUpdatedAt = {
        ...currentFieldTimestamps,
        ...fieldTimestamps,
      };
    } else {
      // Add new status with field timestamps
      syncData.syncStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: 0, // Never synced
        fieldsUpdatedAt: fieldTimestamps,
        needsSync: true,
        syncCompleted: false,
      });
    }

    // Update timestamp and save back to instance parameters
    syncData.lastUpdated = Date.now();
    await sdk.app.setParameters({
      ...parameters,
      syncData,
    });

    logger.log('Updated field timestamps for entry with SDK:', entryId);
  } catch (error) {
    logger.error('Error updating field timestamps with SDK:', error);
    // Fall back to localStorage if SDK fails
    updateFieldTimestampsWithLocalStorage(entryId, contentTypeId, fieldTimestamps);
  }
};

/**
 * Helper function to update timestamp information for specific fields using localStorage
 */
const updateFieldTimestampsWithLocalStorage = (
  entryId: string,
  contentTypeId: string,
  fieldTimestamps: Record<string, number>
): void => {
  try {
    const storageKey = 'klaviyo_sync_status';
    const existingStatusesStr = localStorage.getItem(storageKey);
    const existingStatuses = existingStatusesStr ? JSON.parse(existingStatusesStr) : [];

    const statusIndex = existingStatuses.findIndex(
      (status: SyncStatus) => status.entryId === entryId && status.contentTypeId === contentTypeId
    );

    if (statusIndex >= 0) {
      // Update existing status
      const currentFieldTimestamps = existingStatuses[statusIndex].fieldsUpdatedAt || {};
      existingStatuses[statusIndex].fieldsUpdatedAt = {
        ...currentFieldTimestamps,
        ...fieldTimestamps,
      };
    } else {
      // Add new status with field timestamps
      existingStatuses.push({
        entryId,
        contentTypeId,
        lastSynced: 0, // Never synced
        fieldsUpdatedAt: fieldTimestamps,
        needsSync: true,
        syncCompleted: false,
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(existingStatuses));
    logger.log('Updated field timestamps for entry with localStorage:', entryId);
  } catch (error) {
    logger.error('Error updating field timestamps with localStorage:', error);
  }
};

// Add a helper to get the effective spaceId from sdk
const getEffectiveSpaceId = (sdk: any): string | undefined => {
  return sdk?.parameters?.installation?.spaceId || sdk?.ids?.space;
};
