import { useQuery } from '@tanstack/react-query';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useContentTypes } from './useContentTypes';
import { useUsers } from './useUsers';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { RELEASES_PER_PAGE } from '../utils/consts';
import { EntryProps } from 'contentful-management';
import { isWithin, parseDate, subDays } from '../utils/dateCalculator';
import { getCreatorFromEntry } from '../utils/UserUtils';
import { getEntryStatus, getEntryTitle } from '../utils/EntryUtils';
import { useMemo } from 'react';
import { Creator, EntryStatus } from '../utils/types';

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
}

export function useRecentlyPublishedContent( page: number, entries: EntryProps[]): UseRecentlyPublishedResult {
  const skip = page * RELEASES_PER_PAGE;
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const recentlyPublishedDays = installation.recentlyPublishedDays ?? 7;
  const defaultLocale = sdk.locales.default;

  const recentlyPublishedEntries = entries.filter((entry) => {
    const publishedAt = parseDate(entry?.sys?.publishedAt);
    if (!publishedAt) return false;
    return isWithin(publishedAt, subDays(new Date(), recentlyPublishedDays), new Date());
  });

  const userIds = Array.from(
    new Set(recentlyPublishedEntries.map((entry) => entry.sys.createdBy?.sys?.id).filter(Boolean) as string[])
  );

  const contentTypeIds = Array.from(
    new Set(recentlyPublishedEntries.map((entry) => entry.sys.contentType?.sys?.id).filter(Boolean) as string[])
  );

  const { contentTypes, isFetchingContentTypes, refetchContentTypes } = useContentTypes(contentTypeIds);
  const { usersMap, isFetching: isFetchingUsers, refetch: refetchUsers } = useUsers(userIds);


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


  const isFetching = isFetchingContentTypes || isFetchingUsers;

  return {
    items: recentlyPublishedItems.slice(skip, skip + RELEASES_PER_PAGE),
    total: recentlyPublishedItems.length,
    isFetching,
    refetch: () => {
      refetchContentTypes();
      refetchUsers();
    },
  };
}
