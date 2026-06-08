import { useMemo } from 'react';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useUsers } from './useUsers';
import { useEntryTitlesForIds } from './useEntryTitlesForIds';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { ITEMS_PER_PAGE } from '../utils/consts';
import { getEntryTitle, getUniqueUserIdsFromEntries } from '../utils/EntryUtils';
import { parseDate, subMonths, msPerDay } from '../utils/dateUtils';
import { EntryProps, ContentTypeProps } from 'contentful-management';
import { getCreatorFromEntry } from '../utils/UserUtils';
import { Creator } from '../utils/types';

export interface NeedsUpdateItem {
  id: string;
  title: string;
  age: number;
  publishedDate: string | null;
  creator: Creator | null;
  contentType: string;
}

export interface UseNeedsUpdateResult {
  items: NeedsUpdateItem[];
  total: number;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

function calculateAgeInDays(date: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  return Math.floor(diffTime / msPerDay);
}

export function useNeedsUpdate(
  entries: EntryProps[],
  page: number = 0,
  contentTypes: Map<string, ContentTypeProps>,
  overrideContentTypeIds?: string[]
): UseNeedsUpdateResult {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const installation = (sdk.parameters.installation ?? {}) as AppInstallationParameters;
  const needsUpdateMonths = installation.needsUpdateMonths ?? 6;
  const needsUpdateContentTypes = installation.needsUpdateContentTypes ?? [];
  const activeContentTypeIds = overrideContentTypeIds ?? needsUpdateContentTypes;
  const defaultLocale = sdk.locales.default;

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const updatedAt = parseDate(entry?.sys?.updatedAt);
        if (!updatedAt) return false;
        const thresholdDate = subMonths(new Date(), needsUpdateMonths);
        if (updatedAt.getTime() >= thresholdDate.getTime()) return false;

        if (activeContentTypeIds.length > 0) {
          const contentTypeId = entry.sys.contentType?.sys?.id;
          if (!contentTypeId || !activeContentTypeIds.includes(contentTypeId)) return false;
        }

        return true;
      }),
    [entries, needsUpdateMonths, activeContentTypeIds]
  );

  const userIds = getUniqueUserIdsFromEntries(filteredEntries);

  const {
    usersMap,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
    error: usersError,
  } = useUsers(userIds);

  // Sort by age (sys-level) before paginating so the visible-id list is
  // stable and we only fetch titles for the rows actually shown.
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      const aUpdated = parseDate(a.sys.updatedAt)?.getTime() ?? 0;
      const bUpdated = parseDate(b.sys.updatedAt)?.getTime() ?? 0;
      return aUpdated - bUpdated;
    });
  }, [filteredEntries]);

  const skip = page * ITEMS_PER_PAGE;
  const visibleEntries = useMemo(
    () => sortedEntries.slice(skip, skip + ITEMS_PER_PAGE),
    [sortedEntries, skip]
  );
  const visibleIds = useMemo(() => visibleEntries.map((e) => e.sys.id), [visibleEntries]);

  const {
    titlesMap,
    isFetching: isFetchingTitles,
    refetch: refetchTitles,
    error: titlesError,
  } = useEntryTitlesForIds(visibleIds);

  const needsUpdateItems = useMemo(() => {
    return visibleEntries.map((entry) => {
      const contentType = contentTypes.get(entry.sys.contentType?.sys?.id || '');
      return {
        id: entry.sys.id,
        title: getEntryTitle(titlesMap.get(entry.sys.id) ?? entry, contentType, defaultLocale),
        age: calculateAgeInDays(parseDate(entry.sys.updatedAt) || new Date()),
        publishedDate: entry.sys.publishedAt ?? null,
        creator: getCreatorFromEntry(entry, usersMap),
        contentType: contentType?.name || '',
      };
    });
  }, [visibleEntries, contentTypes, usersMap, defaultLocale, titlesMap]);

  return {
    items: needsUpdateItems,
    total: sortedEntries.length,
    isFetching: isFetchingUsers || isFetchingTitles,
    error: usersError ?? titlesError ?? null,
    refetch: () => {
      refetchUsers();
      refetchTitles();
    },
  };
}
