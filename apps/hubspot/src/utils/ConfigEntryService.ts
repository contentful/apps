import { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import {
  CONFIG_CONTENT_TYPE_ID,
  CONFIG_ENTRY_ID,
  CONFIG_FIELD_ID,
  ConnectedFields,
  getDefaultLocale,
} from './utils';

class ConfigEntryService {
  private cma: PlainClientAPI;

  constructor(cma: PlainClientAPI) {
    this.cma = cma;
  }

  async createConfig() {
    await this.createContentType();
    await this.createEntry();
  }

  async createContentType() {
    const contentTypeBody = {
      name: CONFIG_CONTENT_TYPE_ID,
      description: 'Content Type used by the Hubspot app. Do not delete or modify manually.',
      fields: [
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

  async createEntry() {
    try {
      await this.cma.entry.createWithId(
        { contentTypeId: CONFIG_CONTENT_TYPE_ID, entryId: CONFIG_ENTRY_ID },
        { fields: {} }
      );
    } catch (e: any) {
      // Only ignore error if entry already exists
      if (e?.code !== 'VersionMismatch') {
        throw e;
      }
    }
  }

  async getConfigEntry(): Promise<EntryProps<KeyValueMap>> {
    return this.cma.entry.get({ entryId: CONFIG_ENTRY_ID });
  }

  async updateConfig(
    configEntry: EntryProps<KeyValueMap>,
    connectedFields: ConnectedFields,
    cma: PlainClientAPI,
    defaultLocale?: string
  ) {
    if (!configEntry.fields[CONFIG_FIELD_ID]) {
      configEntry.fields[CONFIG_FIELD_ID] = {};
    }
    defaultLocale ||= await getDefaultLocale(cma);
    configEntry.fields[CONFIG_FIELD_ID][defaultLocale] = connectedFields;
    return await cma.entry.update({ entryId: CONFIG_ENTRY_ID }, configEntry);
  }
}

export default ConfigEntryService;
