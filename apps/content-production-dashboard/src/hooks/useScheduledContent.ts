import { EntryProps } from 'contentful-management';

import { ScheduledContentItem } from '../utils/types';
import { getCreatorFromEntry } from '../utils/UserUtils';
import { getEntryStatus, getEntryTitle } from '../utils/EntryUtils';
import { useEntries } from './useAllEntries';
import { useContentTypes } from './useContentTypes';
import { useUsers } from './useUsers';
import { useScheduledActions } from './useScheduledActions';
import { RELEASES_PER_PAGE } from '../utils/consts';

interface UseScheduledContentResult {
  items: ScheduledContentItem[];
  total: number;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

function generateEntriesMap(entries: EntryProps[]): Map<string, EntryProps> {
  return entries.reduce((map, entry) => {
    map.set(entry.sys.id, entry);
    return map;
  }, new Map<string, EntryProps>());
}

function getUserIdsFromEntries(entries: EntryProps[]): string[] {
  const userIds = entries.map((entry) => entry.sys.createdBy?.sys?.id).filter(Boolean) as string[];

  return [...new Set(userIds)];
}

export function useScheduledContent(
  defaultLocale: string,
  page: number = 0
): UseScheduledContentResult {
  const skip = page * RELEASES_PER_PAGE;
  const { scheduledActions, isFetchingScheduledActions, refetchScheduledActions } =
    useScheduledActions({ query: { 'sys.entity.sys.linkType': 'Entry' } });

  const entryIds = scheduledActions.map((action) => action.entity?.sys?.id || '').filter(Boolean);

  const {
    entries,
    isFetchingEntries,
    fetchingEntriesError: entriesError,
    refetchEntries,
  } = useEntries({
    query: { 'sys.id[in]': entryIds.join(',') },
    enabled: entryIds.length > 0,
  });

  const entriesMap = generateEntriesMap(entries);
  const userIds = getUserIdsFromEntries(entries);

  const { contentTypes, isFetchingContentTypes, refetchContentTypes } = useContentTypes();
  const { usersMap, isFetching: isFetchingUsers } = useUsers(userIds);

  const scheduledItems: ScheduledContentItem[] = [];

  scheduledActions.forEach((action) => {
    const entry = entriesMap.get(action.entity?.sys?.id || '');
    if (!entry) return;

    const contentType = contentTypes.get(entry.sys.contentType?.sys?.id || '');

    scheduledItems.push({
      id: entry.sys.id,
      title: getEntryTitle(entry, contentType, defaultLocale),
      contentType: contentType?.name || '',
      contentTypeId: entry.sys.contentType?.sys?.id || '',
      creator: getCreatorFromEntry(entry, usersMap),
      publishedDate: entry.sys.publishedAt || null,
      updatedDate: entry.sys.updatedAt,
      status: getEntryStatus(entry),
      scheduledActionId: action.sys.id,
      scheduledFor: action.scheduledFor?.datetime || '',
    });
  });

  const isFetching =
    isFetchingScheduledActions || isFetchingEntries || isFetchingContentTypes || isFetchingUsers;
  const error = entriesError;

  if (!scheduledActions.length) {
    return {
      items: [],
      total: 0,
      isFetching,
      error,
      refetch: () => {
        refetchScheduledActions();
        refetchEntries();
        refetchContentTypes();
      },
    };
  }

  return {
    items: scheduledItems.slice(skip, skip + RELEASES_PER_PAGE),
    total: scheduledItems.length,
    isFetching,
    error,
    refetch: () => {
      refetchScheduledActions();
      refetchEntries();
      refetchContentTypes();
    },
  };
}
