import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useContentTypes } from './useContentTypes';
import { useUsers } from './useUsers';
import type { AppInstallationParameters } from '../locations/ConfigScreen';
import { ITEMS_PER_PAGE } from '../utils/consts';
import {
  getEntryTitle,
  getUniqueContentTypeIdsFromEntries,
  getUniqueUserIdsFromEntries,
} from '../utils/EntryUtils';
import { parseDate, subMonths } from '../utils/dateCalculator';
import { EntryProps } from 'contentful-management';
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
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function useNeedsUpdate(entries: EntryProps[], page: number = 0): UseNeedsUpdateResult {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();
  const needsUpdateMonths =
    ((sdk.parameters.installation ?? {}) as AppInstallationParameters).needsUpdateMonths ?? 6;
  const defaultLocale = sdk.locales.default;

  const filteredEntries = entries.filter((entry) => {
    const updatedAt = parseDate(entry?.sys?.updatedAt);
    if (!updatedAt) return false;
    const thresholdDate = subMonths(new Date(), needsUpdateMonths);

    return updatedAt.getTime() < thresholdDate.getTime();
  });

  const userIds = getUniqueUserIdsFromEntries(filteredEntries);
  const contentTypeIds = getUniqueContentTypeIdsFromEntries(filteredEntries);

  const { contentTypes, isFetchingContentTypes, refetchContentTypes, fetchingContentTypesError } =
    useContentTypes(contentTypeIds);
  const {
    usersMap,
    isFetching: isFetchingUsers,
    refetch: refetchUsers,
    error: usersError,
  } = useUsers(userIds);

  const needsUpdateItems = useMemo(() => {
    return filteredEntries.map((entry) => {
      return {
        id: entry.sys.id,
        title: getEntryTitle(
          entry,
          contentTypes.get(entry.sys.contentType?.sys?.id || ''),
          defaultLocale
        ),
        age: calculateAgeInDays(parseDate(entry.sys.updatedAt) || new Date()),
        publishedDate: entry.sys.publishedAt ?? null,
        creator: getCreatorFromEntry(entry, usersMap),
        contentType: contentTypes.get(entry.sys.contentType?.sys?.id || '')?.name || '',
      };
    });
  }, [filteredEntries]);

  const skip = page * ITEMS_PER_PAGE;

  return {
    items: needsUpdateItems.slice(skip, skip + ITEMS_PER_PAGE),
    total: needsUpdateItems.length,
    isFetching: isFetchingContentTypes || isFetchingUsers,
    error: fetchingContentTypesError ?? usersError ?? null,
    refetch: () => {
      refetchContentTypes();
      refetchUsers();
    },
  };
}
