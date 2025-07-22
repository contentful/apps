import { EntryProps, KeyValueMap, PlainClientAPI } from 'contentful-management';
import { EntryConnectedFields, getConfigEntry } from '../utils';
import { Entry } from '../fields/Entry';
import { FieldsFactory } from '../fields/FieldsFactory';

/**
 * Fetches entries from Contentful that have connectedFields.
 */
export async function fetchBrazeConnectedEntries(
  cma: PlainClientAPI,
  contentfulApiKey: string,
  spaceId: string,
  environmentId: string,
  defaultLocale: string,
  configEntry: EntryProps<KeyValueMap>
): Promise<Entry[]> {
  const entries = configEntry?.fields?.connectedFields?.[defaultLocale] || {};
  const entryIds = Object.keys(entries);

  if (!entryIds.length) return [];

  const response = await cma.entry.getMany({
    spaceId: spaceId,
    environmentId: environmentId,
    query: {
      'sys.id[in]': entryIds.join(','),
      limit: 25,
    },
  });

  const rawEntries = response && response.items ? response.items : [];

  return Promise.all(
    rawEntries.map(async (rawEntry: any) => {
      const entryId = rawEntry.sys.id;
      const entryContentTypeId = rawEntry.sys.contentType?.sys?.id || '';
      const entryConnectedFields: EntryConnectedFields = entries[entryId];
      const connectedFieldIds = entryConnectedFields.map((f) => f.fieldId);

      const fieldsFactory = new FieldsFactory(entryId, entryContentTypeId, cma, defaultLocale);
      const fields = await fieldsFactory.createFieldsForConnectedEntry(connectedFieldIds);
      const entryTitle = rawEntry.fields[fields.title]?.[defaultLocale] || 'Untitled';

      return new Entry(
        entryId,
        entryContentTypeId,
        entryTitle,
        fields.fields,
        spaceId,
        environmentId,
        contentfulApiKey,
        rawEntry.sys.publishedAt,
        rawEntry.sys.updatedAt
      );
    })
  );
}
