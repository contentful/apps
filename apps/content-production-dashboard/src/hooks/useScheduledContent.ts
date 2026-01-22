import { useMemo } from 'react';
import { EntryProps, ScheduledActionProps } from 'contentful-management';

import { ScheduledContentItem } from '../utils/types';
import { getCreatorFromEntry } from '../utils/UserUtils';
import { getEntryStatus, getEntryTitle } from '../utils/EntryUtils';
import { useContentTypes } from './useContentTypes';
import { useUsers } from './useUsers';
import { ITEMS_PER_PAGE } from '../utils/consts';

interface UseScheduledContentResult {
  items: ScheduledContentItem[];
  total: number;
  isFetching: boolean;
  refetch: () => void;
}

export function useScheduledContent(
  scheduledActions: ScheduledActionProps[],
  entries: EntryProps[],
  defaultLocale: string,
  page: number = 0
): UseScheduledContentResult {
  const skip = page * ITEMS_PER_PAGE;

  const scheduledEntries = useMemo(
    () =>
      entries.filter((entry) =>
        scheduledActions.some((action) => action.entity?.sys?.id == entry.sys.id)
      ),
    [entries, scheduledActions]
  );

  const userIds = useMemo(() => getUserIdsFromEntries(scheduledEntries), [scheduledEntries]);
  const contentTypeIds = useMemo(
    () => getContentTypeIdsFromEntries(scheduledEntries),
    [scheduledEntries]
  );

  const {
    usersMap,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
    error: fetchingUsersError,
  } = useUsers(userIds);
  const { contentTypes, isFetchingContentTypes, refetchContentTypes, fetchingContentTypesError } =
    useContentTypes(contentTypeIds);

  const scheduledItems = useMemo(() => {
    const items: ScheduledContentItem[] = [];

    scheduledActions.forEach((action) => {
      const entry = scheduledEntries.find((e) => e.sys.id === action.entity?.sys?.id);
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
          datetime: action.scheduledFor?.datetime || '',
          timezone: action.scheduledFor?.timezone,
        },
      });
    });

    return items;
  }, [scheduledActions, scheduledEntries, contentTypes, usersMap, defaultLocale]);

  const isFetching = isFetchingUsers || isFetchingContentTypes;

  if (!scheduledActions.length) {
    return {
      items: [],
      total: 0,
      isFetching,
      error: null,
      refetch: () => {
        refetchUsers();
        refetchContentTypes();
      },
    };
  }

  return {
    items: scheduledItems.slice(skip, skip + ITEMS_PER_PAGE),
    total: scheduledItems.length,
    isFetching,
    error: fetchingUsersError ?? fetchingContentTypesError ?? null,
    refetch: () => {
      refetchUsers();
      refetchContentTypes();
    },
  };
}
function getUserIdsFromEntries(scheduledEntries: EntryProps[]): any {
    throw new Error('Function not implemented.');
}

function getContentTypeIdsFromEntries(scheduledEntries: EntryProps[]): any {
    throw new Error('Function not implemented.');
}

