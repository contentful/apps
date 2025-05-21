import { PlainClientAPI } from 'contentful-management';
import { getConfigEntry } from '../utils';
import { Entry } from '../fields/Entry';
import { FieldsFactory } from '../fields/FieldsFactory';
import { EntryConnectedField } from '../components/create/CreateFlow';

/**
 * Fetches entries from Contentful that have connectedFields (with at least one field).
 * @param cma Contentful Management API client
 * @param spaceId The space ID
 * @param environmentId The environment ID
 * @returns Array of entries with connectedFields
 */
export async function fetchBrazeConnectedEntries(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string
): Promise<Entry[]> {
  const configEntry = await getConfigEntry(cma);
  console.log('GET CONGIG ENRTRY: ', configEntry);

  const entrys = configEntry?.fields?.connectedFields?.['en-US'];
  const entrysIds: string[] = [];
  Object.entries(entrys).forEach(([key]) => {
    entrysIds.push(key);
  });

  const entriesResponse = await cma.entry.getMany({
    spaceId,
    environmentId,
    query: {
      'sys.id[in]': entrysIds.join(','),
      limit: 1000,
    },
  });

  console.log('ENTRIES RESPONSE: ', entriesResponse);

  if (!entriesResponse?.items) return [];

  return await Promise.all(
    entriesResponse.items.map(async (rawEntry: any) => {
      const fieldsFactory = new FieldsFactory(
        rawEntry.sys.id,
        rawEntry.sys.contentType?.sys?.id || '',
        cma
      );
      const rawEntryId = rawEntry.sys.id;
      const entryConnectedFields = entrys[rawEntryId];

      console.log('ENTRY CONNECTED FIELDS: ', entryConnectedFields);

      const rawFields = entryConnectedFields.map((contentBlockData: EntryConnectedField) => {
        return {
          fieldId: contentBlockData.fieldId,
          ...rawEntry.fields[contentBlockData.fieldId],
        };
      });

      console.log('RAW FIELDS: ', rawFields);

      const fields = await fieldsFactory.createFieldsForEntryLALALA(rawFields);
      return new Entry(
        rawEntry.sys.id,
        rawEntry.sys.contentType?.sys?.id || '',
        rawEntry.fields?.name?.['en-US'] || 'Untitled', // Todo : get entry name
        fields,
        rawEntry.sys.space?.sys?.id || spaceId,
        rawEntry.sys.environment?.sys?.id || environmentId,
        '',
        rawEntry.sys.publishedAt,
        rawEntry.sys.updatedAt
      );
    })
  );
}
