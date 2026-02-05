import { useMemo } from 'react';
import { EntryProps, ScheduledActionProps, ContentTypeProps } from 'contentful-management';

import { ScheduledContentItem } from '../utils/types';
import { getCreatorFromEntry } from '../utils/UserUtils';
import { getEntryStatus, getEntryTitle, getUniqueUserIdsFromEntries } from '../utils/EntryUtils';
import { useUsers } from './useUsers';
import { ITEMS_PER_PAGE } from '../utils/consts';

interface UseScheduledContentResult {
  items: ScheduledContentItem[];
  total: number;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useScheduledContent(
  scheduledActions: ScheduledActionProps[],
  entries: EntryProps[],
  defaultLocale: string,
  page: number = 0,
  contentTypes: Map<string, ContentTypeProps>
): UseScheduledContentResult {
  const skip = page * ITEMS_PER_PAGE;

  const scheduledEntries = useMemo(
    () =>
      entries.filter((entry) =>
        scheduledActions.some((action) => action.entity.sys.id == entry.sys.id)
      ),
    [entries, scheduledActions]
  );

  const userIds = useMemo(() => getUniqueUserIdsFromEntries(scheduledEntries), [scheduledEntries]);

  const {
    usersMap,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
    error: fetchingUsersError,
  } = useUsers(userIds);

  const scheduledItems = useMemo(() => {
    const items: ScheduledContentItem[] = [];

    scheduledActions.forEach((action) => {
      const entry = scheduledEntries.find((e) => e.sys.id === action.entity.sys.id);
      if (!entry) return;

      const contentType = contentTypes.get(entry.sys.contentType?.sys?.id || '');

      items.push({
        id: entry.sys.id,
        title: getEntryTitle(entry, contentType, defaultLocale),
        contentType: contentType?.name || '',
        creator: getCreatorFromEntry(entry, usersMap),
        publishedDate: entry.sys.publishedAt || null,
        status: getEntryStatus(entry),
        scheduledFor: {
          datetime: action.scheduledFor.datetime,
          timezone: action.scheduledFor.timezone,
        },
      });
    });

    return items;
  }, [scheduledActions, scheduledEntries, contentTypes, usersMap, defaultLocale]);

  if (!scheduledActions.length) {
    return {
      items: [],
      total: 0,
      isFetching: isFetchingUsers,
      error: null,
      refetch: () => {
        refetchUsers();
      },
    };
  }

  return {
    items: scheduledItems.slice(skip, skip + ITEMS_PER_PAGE),
    total: scheduledItems.length,
    isFetching: isFetchingUsers,
    error: fetchingUsersError ?? null,
    refetch: () => {
      refetchUsers();
    },
  };
}
