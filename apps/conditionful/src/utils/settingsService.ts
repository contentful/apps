/**
 * Settings Service
 * 
 * Manages the storage and retrieval of rules configuration in a Settings entry.
 * Creates the settings content type and entry if they don't exist.
 */

import { CMAClient } from '@contentful/app-sdk';
import { EntryProps, KeyValueMap } from 'contentful-management';
import { RulesConfig } from '../types/rules';

const SETTINGS_CONTENT_TYPE_ID = 'conditionfulSettings';
const SETTINGS_FIELD_ID = 'rulesConfig';
const SETTINGS_ENTRY_TITLE = 'Conditionful Rules Configuration';

interface SettingsServiceConfig {
  cma: CMAClient;
  spaceId: string;
  environmentId: string;
  defaultLocale: string;
}

export class SettingsService {
  private cma: CMAClient;
  private spaceId: string;
  private environmentId: string;
  private defaultLocale: string;
  private settingsEntry: EntryProps<KeyValueMap> | null = null;

  constructor(config: SettingsServiceConfig) {
    this.cma = config.cma;
    this.spaceId = config.spaceId;
    this.environmentId = config.environmentId;
    this.defaultLocale = config.defaultLocale;
  }

  /**
   * Initialize the settings service by ensuring content type and entry exist
   */
  async initialize(): Promise<void> {
    await this.ensureContentTypeExists();
    await this.ensureSettingsEntryExists();
  }

  /**
   * Load rules configuration from the settings entry
   */
  async loadRules(): Promise<RulesConfig> {
    try {
      console.log('[SettingsService] Loading rules from settings entry');
      const entry = await this.getSettingsEntry();
      console.log('[SettingsService] Settings entry:', entry);
      
      if (entry.fields[SETTINGS_FIELD_ID]?.[this.defaultLocale]) {
        const rulesJson = entry.fields[SETTINGS_FIELD_ID][this.defaultLocale];
        console.log('[SettingsService] Raw rules JSON:', rulesJson);
        
        // If it's a string, parse it. If it's already an object, return it
        if (typeof rulesJson === 'string') {
          const parsed = JSON.parse(rulesJson);
          console.log('[SettingsService] Parsed rules:', parsed);
          return parsed;
        }
        console.log('[SettingsService] Rules already parsed:', rulesJson);
        return rulesJson as RulesConfig;
      }
      
      console.log('[SettingsService] No rules found in settings entry, returning empty');
      return {};
    } catch (error) {
      console.error('[SettingsService] Error loading rules from settings entry:', error);
      return {};
    }
  }

  /**
   * Save rules configuration to the settings entry
   */
  async saveRules(rules: RulesConfig): Promise<void> {
    try {
      console.log('[SettingsService] Saving rules:', rules);
      const entry = await this.getSettingsEntry();
      console.log('[SettingsService] Current entry:', entry);
      
      const rulesJson = JSON.stringify(rules);
      console.log('[SettingsService] Serialized rules:', rulesJson);
      
      // Update the entry with new rules
      const updatedEntry = await this.cma.entry.update(
        {
          entryId: entry.sys.id,
          spaceId: this.spaceId,
          environmentId: this.environmentId,
        },
        {
          ...entry,
          fields: {
            ...entry.fields,
            [SETTINGS_FIELD_ID]: {
              [this.defaultLocale]: rulesJson,
            },
          },
        }
      );
      console.log('[SettingsService] Entry updated:', updatedEntry);

      // Publish the updated entry
      const publishedEntry = await this.cma.entry.publish(
        {
          entryId: updatedEntry.sys.id,
          spaceId: this.spaceId,
          environmentId: this.environmentId,
        },
        updatedEntry
      );
      console.log('[SettingsService] Entry published:', publishedEntry);

      // Update local cache
      this.settingsEntry = publishedEntry;
      console.log('[SettingsService] Rules saved successfully');
    } catch (error) {
      console.error('[SettingsService] Error saving rules to settings entry:', error);
      throw new Error('Failed to save rules configuration');
    }
  }

  /**
   * Get the settings entry, creating it if necessary
   */
  private async getSettingsEntry(): Promise<EntryProps<KeyValueMap>> {
    if (this.settingsEntry) {
      return this.settingsEntry;
    }

    // Search for existing settings entry
    const entries = await this.cma.entry.getMany({
      query: {
        content_type: SETTINGS_CONTENT_TYPE_ID,
        limit: 1,
      },
    });

    if (entries.items.length > 0) {
      this.settingsEntry = entries.items[0];
      return this.settingsEntry;
    }

    // Create new settings entry if none exists
    return this.createSettingsEntry();
  }

  /**
   * Ensure the settings content type exists
   */
  private async ensureContentTypeExists(): Promise<void> {
    try {
      // Try to get the content type
      const contentType = await this.cma.contentType.get({
        contentTypeId: SETTINGS_CONTENT_TYPE_ID,
      });
      
      // If we get a response but it's empty or doesn't have the expected structure, create it
      if (!contentType || !contentType.sys) {
        await this.createContentType();
      }
    } catch (error: any) {
      // If there's any error (including 404 or other issues), try to create it
      console.log('Content type not found, creating it...');
      await this.createContentType();
    }
  }

  /**
   * Create the settings content type
   */
  private async createContentType(): Promise<void> {
    const contentTypeBody = {
      name: 'Conditionful Settings',
      description: 'Stores Conditionful app rules configuration. Do not delete or modify manually.',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          required: true,
          localized: false,
          type: 'Symbol',
        },
        {
          id: SETTINGS_FIELD_ID,
          name: 'Rules Configuration',
          required: false,
          localized: false,
          type: 'Text',
        },
      ],
    };

    try {
      const contentType = await this.cma.contentType.createWithId(
        { contentTypeId: SETTINGS_CONTENT_TYPE_ID },
        contentTypeBody
      );

      await this.cma.contentType.publish(
        { contentTypeId: SETTINGS_CONTENT_TYPE_ID },
        contentType
      );
    } catch (error: any) {
      // Ignore if content type already exists (race condition)
      if (error.code !== 'VersionMismatch') {
        throw error;
      }
    }
  }

  /**
   * Ensure a settings entry exists
   */
  private async ensureSettingsEntryExists(): Promise<void> {
    try {
      await this.getSettingsEntry();
    } catch (error) {
      // If no entry exists, it will be created by createSettingsEntry
      console.log('Settings entry will be created on first save');
    }
  }

  /**
   * Create a new settings entry
   */
  private async createSettingsEntry(): Promise<EntryProps<KeyValueMap>> {
    try {
      const entry = await this.cma.entry.create(
        {
          spaceId: this.spaceId,
          environmentId: this.environmentId,
          contentTypeId: SETTINGS_CONTENT_TYPE_ID,
        },
        {
          fields: {
            title: {
              [this.defaultLocale]: SETTINGS_ENTRY_TITLE,
            },
            [SETTINGS_FIELD_ID]: {
              [this.defaultLocale]: JSON.stringify({}),
            },
          },
        }
      );

      // Publish the new entry
      const publishedEntry = await this.cma.entry.publish(
        {
          entryId: entry.sys.id,
          spaceId: this.spaceId,
          environmentId: this.environmentId,
        },
        entry
      );

      this.settingsEntry = publishedEntry;
      return publishedEntry;
    } catch (error) {
      console.error('Error creating settings entry:', error);
      throw new Error('Failed to create settings entry');
    }
  }
}

