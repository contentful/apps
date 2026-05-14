import { BaseAppSDK } from '@contentful/app-sdk';
import { EntryProps } from 'contentful-management';

// Fetches full entries for a small set of ids so callers can resolve
// titles. Pairs with the `select: 'sys'` bulk fetch in fetchAllEntries:
// the bulk fetch omits `fields`, and this lazy fetch fills them in only
// for the visible page of a table.
//
// CMA accepts up to 50 ids in `sys.id[in]`, and ITEMS_PER_PAGE is 5, so
// a single request always covers one table page.
export async function fetchEntryTitlesForIds(
  sdk: BaseAppSDK,
  ids: string[]
): Promise<EntryProps[]> {
  if (ids.length === 0) {
    return [];
  }

  const response = await sdk.cma.entry.getMany({
    query: {
      'sys.id[in]': ids.join(','),
      limit: ids.length,
    },
  });

  return response.items as EntryProps[];
}
