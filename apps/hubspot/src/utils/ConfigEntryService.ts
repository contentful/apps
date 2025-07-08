import { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import {
  CONFIG_CONTENT_TYPE_ID,
  CONFIG_ENTRY_ID,
  CONFIG_FIELD_ID,
  ConnectedFields,
  EntryConnectedFields,
} from './utils';

class ConfigEntryService {
  private cma: PlainClientAPI;
  private configEntry?: EntryProps<KeyValueMap>;
  private defaultLocale: string | undefined;

  constructor(cma: PlainClientAPI, defaultLocale?: string) {
    this.cma = cma;
    this.defaultLocale = defaultLocale;
  }

  async createConfig() {
    await this.createContentType();
    await this.createEntry();
  }

  private async getConfigEntry(): Promise<EntryProps<KeyValueMap>> {
    if (!this.configEntry) {
      this.configEntry = await this.cma.entry.get({ entryId: CONFIG_ENTRY_ID });
    }
    return this.configEntry;
  }

  async updateConfig(connectedFields: ConnectedFields) {
    const configEntry = await this.getConfigEntry();

    if (!configEntry.fields[CONFIG_FIELD_ID]) {
      configEntry.fields[CONFIG_FIELD_ID] = {};
    }

    configEntry.fields[CONFIG_FIELD_ID][await this.getDefaultLocale()] = connectedFields;
    const updatedEntry = await this.cma.entry.update({ entryId: CONFIG_ENTRY_ID }, configEntry);
    this.configEntry = updatedEntry;

    return updatedEntry;
  }

  async getConnectedFields(): Promise<ConnectedFields> {
    const configEntry = await this.getConfigEntry();
    return configEntry.fields[CONFIG_FIELD_ID][await this.getDefaultLocale()];
  }

  async getEntryConnectedFields(entryId: string): Promise<EntryConnectedFields> {
    const connectedFields = await this.getConnectedFields();
    return connectedFields[entryId] || [];
  }

  private async createContentType() {
    const contentTypeBody = {
      name: CONFIG_CONTENT_TYPE_ID,
      description: 'Content Type used by the Hubspot app. Do not delete or modify manually.',
      displayField: 'title',
      fields: [
        {
          id: 'title',
          name: 'Title',
          required: true,
          localized: false,
          type: 'Text',
        },
        {
          id: CONFIG_FIELD_ID,
          name: CONFIG_FIELD_ID,
          required: false,
          localized: false,
          type: 'Object',
        },
      ],
    };
    try {
      const contentTypeProps = await this.cma.contentType.createWithId(
        { contentTypeId: CONFIG_CONTENT_TYPE_ID },
        contentTypeBody
      );
      await this.cma.contentType.publish(
        { contentTypeId: CONFIG_CONTENT_TYPE_ID },
        contentTypeProps
      );
    } catch (e: any) {
      // Only ignore error if content type already exists
      if (e?.code !== 'VersionMismatch') {
        throw e;
      }
    }
  }

  private async createEntry() {
    try {
      await this.cma.entry.createWithId(
        { contentTypeId: CONFIG_CONTENT_TYPE_ID, entryId: CONFIG_ENTRY_ID },
        {
          fields: {
            title: { [await this.getDefaultLocale()]: 'Hubspot App Configuration' },
          },
        }
      );
    } catch (e: any) {
      // Only ignore error if entry already exists
      if (e?.code !== 'VersionMismatch') {
        throw e;
      }
    }
  }

  private async getDefaultLocale(): Promise<string> {
    if (!this.defaultLocale) {
      const fallbackLocale = 'en-US';
      try {
        const locales = await this.cma.locale.getMany({ query: { limit: 1000 } });
        const defaultLocale = locales.items.find((locale) => locale.default);
        this.defaultLocale = defaultLocale?.code || fallbackLocale;
      } catch (error) {
        this.defaultLocale = fallbackLocale;
      }
    }

    return this.defaultLocale;
  }
}

export default ConfigEntryService;
