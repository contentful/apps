import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HomeAppSDK, PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { UserProps } from 'contentful-management';

interface UseUsersResult {
  usersMap: Map<string, UserProps>;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUsers(userIds: string[]): UseUsersResult {
  const sdk = useSDK<HomeAppSDK | PageAppSDK>();

  const { data, isFetching, error, refetch } = useQuery<UserProps[], Error>({
    queryKey: ['users', sdk.ids.space, userIds.sort().join(',')],
    enabled: userIds.length > 0,
    queryFn: async () => {
      if (userIds.length === 0) {
        return [];
      }

      const response = await sdk.cma.user.getManyForSpace({
        spaceId: sdk.ids.space,
        query: { 'sys.id[in]': userIds.join(','), fields: 'firstName,lastName' },
      });

      return response.items;
    },
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserProps>();
    (data ?? []).forEach((user) => {
      map.set(user.sys.id, user);
    });
    return map;
  }, [data]);

  return {
    usersMap,
    isFetching,
    error: error ?? null,
    refetch,
  };
}
