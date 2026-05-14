import { useMemo } from 'react';
import { EntryProps, ScheduledActionProps, ContentTypeProps } from 'contentful-management';

import { ScheduledContentItem } from '../utils/types';
import { getCreatorFromEntry } from '../utils/UserUtils';
import { getEntryStatus, getEntryTitle, getUniqueUserIdsFromEntries } from '../utils/EntryUtils';
import { useUsers } from './useUsers';
import { useEntryTitlesForIds } from './useEntryTitlesForIds';
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

  // Unlike useNeedsUpdateContent / useRecentlyPublishedContent, ordering
  // is driven by scheduledActions (not by entries). Build the
  // action->entry pair list in action order, then paginate, so titles
  // are only fetched for the visible page.
  const orderedPairs = useMemo(() => {
    const pairs: { entry: EntryProps; action: ScheduledActionProps }[] = [];
    scheduledActions.forEach((action) => {
      const entry = scheduledEntries.find((e) => e.sys.id === action.entity.sys.id);
      if (entry) {
        pairs.push({ entry, action });
      }
    });
    return pairs;
  }, [scheduledActions, scheduledEntries]);

  const visiblePairs = useMemo(
    () => orderedPairs.slice(skip, skip + ITEMS_PER_PAGE),
    [orderedPairs, skip]
  );
  const visibleIds = useMemo(() => visiblePairs.map((p) => p.entry.sys.id), [visiblePairs]);

  const {
    titlesMap,
    isFetching: isFetchingTitles,
    refetch: refetchTitles,
    error: titlesError,
  } = useEntryTitlesForIds(visibleIds);

  const scheduledItems = useMemo(() => {
    return visiblePairs.map<ScheduledContentItem>(({ entry, action }) => {
      const contentType = contentTypes.get(entry.sys.contentType?.sys?.id || '');
      return {
        id: entry.sys.id,
        title: getEntryTitle(titlesMap.get(entry.sys.id) ?? entry, contentType, defaultLocale),
        contentType: contentType?.name || '',
        creator: getCreatorFromEntry(entry, usersMap),
        publishedDate: entry.sys.publishedAt || null,
        status: getEntryStatus(entry),
        scheduledFor: {
          datetime: action.scheduledFor.datetime,
          timezone: action.scheduledFor.timezone,
        },
      };
    });
  }, [visiblePairs, contentTypes, usersMap, defaultLocale, titlesMap]);

  if (!scheduledActions.length) {
    return {
      items: [],
      total: 0,
      isFetching: isFetchingUsers || isFetchingTitles,
      error: null,
      refetch: () => {
        refetchUsers();
        refetchTitles();
      },
    };
  }

  return {
    items: scheduledItems,
    total: orderedPairs.length,
    isFetching: isFetchingUsers || isFetchingTitles,
    error: fetchingUsersError ?? titlesError ?? null,
    refetch: () => {
      refetchUsers();
      refetchTitles();
    },
  };
}
