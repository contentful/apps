import { PlainClientAPI } from 'contentful-management';
import { getConfigEntry } from '../utils';
import { Entry } from '../fields/Entry';
import { FieldsFactory } from '../fields/FieldsFactory';
import { EntryConnectedField } from '../components/create/CreateFlow';

/**
 * Fetches entries from Contentful that have connectedFields.
 */
export async function fetchBrazeConnectedEntries(
  cma: PlainClientAPI,
  contentfulApiKey: string,
  spaceId: string,
  environmentId: string
): Promise<Entry[]> {
  const configEntry = await getConfigEntry(cma);
  const entries = configEntry?.fields?.connectedFields?.['en-US'] || {};
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
      const entryConnectedFields: EntryConnectedField[] = entries[entryId];
      const connectedFieldIds = entryConnectedFields.map((f) => f.fieldId);

      const fieldsFactory = new FieldsFactory(entryId, entryContentTypeId, cma);
      const fieldsAndTitle = await fieldsFactory.createFieldsForConnectedFields(connectedFieldIds);
      const entryTitle = rawEntry.fields[fieldsAndTitle.title]?.['en-US'] || 'Untitled';

      return new Entry(
        entryId,
        entryContentTypeId,
        entryTitle,
        fieldsAndTitle.fields,
        spaceId,
        environmentId,
        contentfulApiKey,
        rawEntry.sys.publishedAt,
        rawEntry.sys.updatedAt
      );
    })
  );
}
