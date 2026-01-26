import { useUsers } from './useUsers';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { isWithin, parseDate } from '../utils/dateCalculator';
import { getCreatorFromEntry } from '../utils/UserUtils';
import { getEntryTitle, getUniqueUserIdsFromEntries } from '../utils/EntryUtils';
import { useMemo } from 'react';
import { Creator } from '../utils/types';

export interface RecentlyPublishedItem {
  id: string;
  title: string;
  contentType: string;
  creator: Creator | null;
  publishedDate: string | null;
}

export interface UseRecentlyPublishedResult {
  items: RecentlyPublishedItem[];
  total: number;
  isFetching: boolean;
  refetch: () => void;
  error: Error | null;
}

export function useRecentlyPublishedContent(
  page: number,
  entries: EntryProps[],
  recentlyPublishedDate: Date,
  defaultLocale: string,
  contentTypes: Map<string, ContentTypeProps>
): UseRecentlyPublishedResult {
  const skip = page * ITEMS_PER_PAGE;
  const now = new Date();

  const recentlyPublishedEntries = entries.filter((entry) => {
    const publishedAt = parseDate(entry?.sys?.publishedAt);
    if (!publishedAt) return false;
    return isWithin(publishedAt, recentlyPublishedDate, now);
  });

  const userIds = getUniqueUserIdsFromEntries(recentlyPublishedEntries);

  const {
    usersMap,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
    error: usersError,
  } = useUsers(userIds);

  const recentlyPublishedItems = useMemo(() => {
    const items: RecentlyPublishedItem[] = [];
    recentlyPublishedEntries.forEach((entry) => {
      const contentType = contentTypes.get(entry.sys.contentType?.sys?.id || '');

      items.push({
        id: entry.sys.id,
        title: getEntryTitle(entry, contentType, defaultLocale),
        contentType: contentType?.name || '',
        creator: getCreatorFromEntry(entry, usersMap),
        publishedDate: entry.sys.publishedAt || null,
      });
    });

    return items;
  }, [recentlyPublishedEntries, contentTypes, usersMap, defaultLocale]);

  const isFetching = isFetchingUsers;

  return {
    items: recentlyPublishedItems.slice(skip, skip + ITEMS_PER_PAGE),
    total: recentlyPublishedItems.length,
    isFetching,
    refetch: () => {
      refetchUsers();
    },
    error: usersError ?? null,
  };
}
