import { PlainClientAPI } from 'contentful-management';
import { getConfigEntry } from '../utils';
import { Entry } from '../fields/Entry';
import { FieldsFactory } from '../fields/FieldsFactory';

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
    entriesResponse.items.map(async (item: any) => {
      const fieldsFactory = new FieldsFactory(
        item.sys.id,
        item.sys.contentType?.sys?.id || '',
        cma
      );
      const cmaEntry = await fieldsFactory.getEntry();
      console.log('CMA ENTRY: ', cmaEntry);
      console.log('CMA PUB: ', cmaEntry.sys.publishedAt);
      console.log('CMA UPD: ', cmaEntry.sys.updatedAt);
      const fields = await fieldsFactory.createFieldsForEntry(cmaEntry.fields);
      return new Entry(
        item.sys.id,
        item.sys.contentType?.sys?.id || '',
        item.fields?.name?.['en-US'] || 'Untitled',
        fields,
        item.sys.space?.sys?.id || spaceId,
        item.sys.environment?.sys?.id || environmentId,
        '',
        cmaEntry.sys.publishedAt,
        cmaEntry.sys.updatedAt
      );
    })
  );
}
