import React from 'react';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { locations } from '@contentful/app-sdk';

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
  fieldMappings: Record<string, string>,
  entryData: Record<string, FieldData>
): Promise<any> => {
  try {
    if (!config.publicKey) {
      throw new Error('Klaviyo API key is required');
    }

    // Transform field data according to mappings
    const transformedData = Object.entries(fieldMappings).reduce(
      (acc, [contentfulField, klaviyoField]) => {
        if (entryData[contentfulField]) {
          acc[klaviyoField] = entryData[contentfulField].value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Basic validation
    if (!transformedData.email && !transformedData.phone_number) {
      throw new Error('Either email or phone number is required for Klaviyo profiles');
    }

    // Endpoint defaults to profiles if not specified
    const endpoint = config.endpoint || 'profiles';
    const baseUrl = 'https://a.klaviyo.com/api/v2';

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
import { error } from 'console';

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
        return richTextNode;
      }
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

    // Log unhandled node types
    logger.warn(`Unhandled rich text node type: ${richTextNode.nodeType}`);
    return typeof richTextNode === 'string' ? richTextNode : JSON.stringify(richTextNode);
  } catch (error) {
    // Return the original value if conversion fails
    logger.error('Error converting rich text to HTML:', error);
    return typeof richTextNode === 'string' ? richTextNode : JSON.stringify(richTextNode);
  }
}

// Define the FieldMapping interface to match the service's requirements
interface FieldMapping {
  contentfulFieldId: string;
  fieldType: 'text' | 'image' | 'entry' | 'reference-array';
  klaviyoBlockName: string;
  contentTypeId?: string;
  fields?: any;
  name: string;
  type: string;
  severity: string;
  value: any;
  isAssetField?: boolean;
}

/**
 * Class for syncing Contentful content to Klaviyo
 */
export class SyncContent {
  sdk: any;

  constructor(entry: any, sdk?: any) {
    logger.log('SyncContent constructor initialized');
    // Store the SDK rather than the entry
    this.sdk = sdk || entry; // Support both new and old ways of calling
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
    try {
      // Debugging - log what was passed in
      logger.log('SyncContent.syncContent called with:', {
        hasSdk: !!sdk,
        sdkType: sdk ? typeof sdk : 'undefined',
        mappingsCount: mappings ? mappings.length : 0,
        options: JSON.stringify(options),
        hasIds: !!sdk?.ids,
        idsObject: sdk?.ids ? JSON.stringify(sdk.ids) : 'none',
        entryId:
          options.entryId || sdk?.ids?.entry || (sdk?.entry?.getSys ? 'has getSys' : 'no getSys'),
      });

      // Get entry information from multiple possible sources
      let entryId = options.entryId;
      let contentTypeId = options.contentTypeId;

      // Try to get from sdk.ids first (common for sidebar extensions)
      if (sdk?.ids) {
        if (!entryId && sdk.ids.entry) {
          entryId = sdk.ids.entry;
          logger.log('Got entryId from sdk.ids:', entryId);
        }
        if (!contentTypeId && sdk.ids.contentType) {
          contentTypeId = sdk.ids.contentType;
          logger.log('Got contentTypeId from sdk.ids:', contentTypeId);
        }
      }

      // If still missing, try to get from sdk.entry (for dialog extensions)
      if ((!entryId || !contentTypeId) && sdk?.entry) {
        try {
          // First try getSys method
          if (typeof sdk.entry.getSys === 'function') {
            const entrySys = sdk.entry.getSys();
            if (!entryId && entrySys?.id) {
              entryId = entrySys.id;
              logger.log('Got entryId from sdk.entry.getSys():', entryId);
            }
            if (!contentTypeId && entrySys?.contentType?.sys?.id) {
              contentTypeId = entrySys.contentType.sys.id;
              logger.log('Got contentTypeId from sdk.entry.getSys():', contentTypeId);
            }
          }
          // Alternative approach to get sys data if getSys is not a function
          else if (sdk.entry.sys) {
            const entrySys = sdk.entry.sys;
            if (!entryId && entrySys?.id) {
              entryId = entrySys.id;
              logger.log('Got entryId from sdk.entry.sys:', entryId);
            }
            if (!contentTypeId && entrySys?.contentType?.sys?.id) {
              contentTypeId = entrySys.contentType.sys.id;
              logger.log('Got contentTypeId from sdk.entry.sys:', contentTypeId);
            }
          }
        } catch (e) {
          logger.error('Error getting entry sys data:', e);
        }
      }

      // Attempt to get from sys if passed entry has sys property directly
      if ((!entryId || !contentTypeId) && sdk?.sys) {
        if (!entryId && sdk.sys.id) {
          entryId = sdk.sys.id;
          logger.log('Got entryId from sdk.sys:', entryId);
        }
        if (!contentTypeId && sdk.sys.contentType?.sys?.id) {
          contentTypeId = sdk.sys.contentType.sys.id;
          logger.log('Got contentTypeId from sdk.sys:', contentTypeId);
        }
      }

      // Last attempt - try to get from the entry parameter directly
      if ((!entryId || !contentTypeId) && sdk?.entry?.sys) {
        const entrySys = sdk.entry.sys;
        if (!entryId && entrySys.id) {
          entryId = entrySys.id;
          logger.log('Got entryId from entry.sys:', entryId);
        }
        if (!contentTypeId && entrySys.contentType?.sys?.id) {
          contentTypeId = entrySys.contentType.sys.id;
          logger.log('Got contentTypeId from entry.sys:', contentTypeId);
        }
      }

      // One more try with this.sdk if different from passed sdk
      if ((!entryId || !contentTypeId) && this.sdk && this.sdk !== sdk) {
        if (!entryId && this.sdk.ids?.entry) {
          entryId = this.sdk.ids.entry;
        }
        if (!contentTypeId && this.sdk.ids?.contentType) {
          contentTypeId = this.sdk.ids.contentType;
        }

        // Try entry.sys as well
        if ((!entryId || !contentTypeId) && this.sdk.entry) {
          try {
            // Try getSys method first
            if (typeof this.sdk.entry.getSys === 'function') {
              const entrySys = this.sdk.entry.getSys();
              if (!entryId && entrySys?.id) {
                entryId = entrySys.id;
              }
              if (!contentTypeId && entrySys?.contentType?.sys?.id) {
                contentTypeId = entrySys.contentType.sys.id;
              }
            }
            // Alternative approach to get sys data if getSys is not a function
            else if (this.sdk.entry.sys) {
              const entrySys = this.sdk.entry.sys;
              if (!entryId && entrySys?.id) {
                entryId = entrySys.id;
              }
              if (!contentTypeId && entrySys?.contentType?.sys?.id) {
                contentTypeId = entrySys.contentType.sys.id;
              }
            }
          } catch (e) {
            logger.error('Error getting entry sys data from this.sdk:', e);
          }
        }
      }

      // Log all the places we've tried to get the IDs from
      logger.log('Entry and content type ID resolution:', {
        finalEntryId: entryId,
        finalContentTypeId: contentTypeId,
        fromOptions: {
          entryId: options.entryId,
          contentTypeId: options.contentTypeId,
        },
        fromSdkIds: {
          entryId: sdk?.ids?.entry,
          contentTypeId: sdk?.ids?.contentType,
        },
        fromThisSdkIds: {
          entryId: this.sdk?.ids?.entry,
          contentTypeId: this.sdk?.ids?.contentType,
        },
        entryApiMethods: sdk?.entry
          ? Object.keys(sdk.entry).filter((k) => typeof sdk.entry[k] === 'function')
          : [],
        hasEntryGetSys: typeof sdk?.entry?.getSys === 'function',
        hasEntrySys: sdk?.entry && 'sys' in sdk.entry,
        hasSdkEntry: !!sdk?.entry,
      });

      if (!entryId || !contentTypeId) {
        logger.error('syncContent missing entryId or contentTypeId:', {
          entryId,
          contentTypeId,
          options,
        });
        return { success: false, error: 'Missing entry ID or content type ID' };
      }

      logger.log(`Syncing entry ${entryId} of content type ${contentTypeId}`);

      // Get entry fields data if we have SDK access
      let entryFields: Record<string, any> = {};
      const spaceId = sdk.ids.space || sdk.entry.sys.space.sys.id;
      console.log('sdk', sdk);
      console.log('entryId', entryId);
      console.log('spaceId', spaceId);
      console.log('environmentId', sdk.ids.environment);
      const entry = await sdk.cma.entry.get({
        entryId,
        spaceId,
        environmentId: sdk.ids.environment,
      });
      console.log('entry', entry);

      // Process entry data from CMA response
      if (entry?.fields) {
        try {
          // For CMA entry responses, fields are localized with locale keys (e.g., 'en-US')
          const fields = entry.fields;

          // Process localized fields
          Object.keys(fields).forEach((fieldId) => {
            try {
              // Get the field value, typically stored under a locale key like 'en-US'
              const fieldData = fields[fieldId];

              // Find the first available locale (usually 'en-US')
              const localeKeys = Object.keys(fieldData);
              if (localeKeys.length > 0) {
                const firstLocale = localeKeys[0];
                const rawValue = fieldData[firstLocale];

                if (rawValue !== undefined && rawValue !== null) {
                  // For rich text, include the entire document
                  if (
                    rawValue &&
                    typeof rawValue === 'object' &&
                    (rawValue.nodeType === 'document' || (rawValue.data && rawValue.content))
                  ) {
                    entryFields[fieldId] = rawValue;
                  }
                  // For asset references
                  else if (
                    rawValue &&
                    typeof rawValue === 'object' &&
                    rawValue.sys &&
                    (rawValue.sys.linkType === 'Asset' || rawValue.sys.type === 'Asset')
                  ) {
                    entryFields[fieldId] = rawValue;
                  }
                  // For arrays (like references)
                  else if (Array.isArray(rawValue)) {
                    entryFields[fieldId] = rawValue;
                  }
                  // For simple values
                  else {
                    entryFields[fieldId] = rawValue;
                  }
                }
              }
            } catch (fieldError) {
              logger.warn(`Error processing field ${fieldId}:`, fieldError);
            }
          });

          // Log the processed entry fields for debugging
          logger.log('Successfully processed entry fields from CMA:', {
            fieldCount: Object.keys(entryFields).length,
            fieldIds: Object.keys(entryFields),
          });
        } catch (error) {
          logger.error('Error processing entry fields from CMA:', error);
        }
      }
      // Fallback to SDK field methods if CMA method failed
      else if (sdk?.entry?.fields) {
        try {
          const fields = sdk.entry.fields;

          // Process fields to get current values
          Object.keys(fields).forEach((fieldId) => {
            try {
              const field = fields[fieldId];
              // For localized content, take the current locale value
              if (typeof field.getValue === 'function') {
                const rawValue = field.getValue();

                if (rawValue !== undefined && rawValue !== null) {
                  // For rich text, include the entire document
                  if (
                    rawValue &&
                    typeof rawValue === 'object' &&
                    rawValue.nodeType === 'document'
                  ) {
                    entryFields[fieldId] = rawValue;
                  }
                  // For arrays (like references)
                  else if (Array.isArray(rawValue)) {
                    entryFields[fieldId] = rawValue;
                  }
                  // For simple values
                  else {
                    entryFields[fieldId] = rawValue;
                  }
                }
              }
            } catch (fieldError) {
              logger.warn(`Error processing field ${fieldId}:`, fieldError);
            }
          });

          logger.log('Successfully processed entry fields from SDK:', {
            fieldCount: Object.keys(entryFields).length,
            fieldIds: Object.keys(entryFields),
          });
        } catch (error) {
          logger.error('Error processing entry fields from SDK:', error);
        }
      }

      // Add the entry title as a special field if not already present
      if (!entryFields.title && entry?.sys?.id) {
        entryFields.title = `Entry ${entry.sys.id}`;
      } else if (!entryFields.title && sdk?.entry?.getSys) {
        try {
          const entrySys = sdk.entry.getSys();
          entryFields.title = entrySys.id
            ? `Entry ${entrySys.id}`
            : entryId
            ? `Entry ${entryId}`
            : 'Untitled Entry';
        } catch (error) {
          logger.warn('Error getting entry title:', error);
          entryFields.title = entryId ? `Entry ${entryId}` : 'Untitled Entry';
        }
      } else if (!entryFields.title) {
        entryFields.title = entryId ? `Entry ${entryId}` : 'Untitled Entry';
      }

      // Process rich text fields to convert them to HTML if needed
      for (const fieldId of Object.keys(entryFields)) {
        const value = entryFields[fieldId];
        if (value && typeof value === 'object' && value.nodeType === 'document') {
          try {
            // Convert rich text to HTML
            entryFields[fieldId] = richTextToHtml(value);
            logger.log(`Converted rich text field ${fieldId} to HTML`);
          } catch (error) {
            logger.error(`Error converting rich text field ${fieldId}:`, error);
          }
        }
      }

      // Log the final prepared entry fields
      logger.log('Prepared entry fields for sync:', {
        fieldCount: Object.keys(entryFields).length,
        fieldIds: Object.keys(entryFields).join(', '),
        titleField: entryFields.title,
      });

      // Import the syncEntryToKlaviyo function dynamically to avoid circular dependencies
      const { syncEntryToKlaviyo } = await import('../utils/sync-api');

      // Call the API to sync data to Klaviyo, passing entry data
      const syncResult = await syncEntryToKlaviyo(entryId, contentTypeId, entryFields);

      // Log the result
      if (syncResult.success) {
        logger.log('Successfully synced content to Klaviyo:', syncResult);

        // Update sync status
        const contentTypeName = sdk.contentType?.name || '';

        if (sdk.contentType) {
          await this.updateSyncStatusSimple(contentTypeId, contentTypeName, true);
        }

        // Show success notification if SDK is available
        if (sdk.notifier) {
          sdk.notifier.success('Content synced to Klaviyo successfully');
        }

        return { success: true };
      } else {
        const errorMessage = syncResult.errors?.join(', ') || 'Unknown error occurred during sync';
        logger.error('Error syncing content to Klaviyo:', errorMessage);

        // Show error notification if SDK is available
        if (sdk.notifier) {
          sdk.notifier.error(`Error syncing to Klaviyo: ${errorMessage}`);
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      logger.error('Error in syncContent:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
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
