import { useInBrowserSdk } from '~/hooks/useInBrowserSdk';
import { useQuery } from '@tanstack/react-query';

export function useContentfulUsers(userIds: string[]) {
  const { cma, sdk } = useInBrowserSdk();

  return useQuery({
    queryKey: [sdk?.ids.organization, sdk?.ids.space, sdk?.ids.environment, 'users', userIds],
    queryFn: async () => {
      const result = await cma?.user.getManyForSpace({
        spaceId: sdk?.ids.space,
        organizationId: sdk?.ids.organization,
        query: {
          'sys.id[in]': userIds,
        },
      });

      return result?.items || [];
    },
    enabled: !!userIds.length,
    initialData: [],
    placeholderData: [],
  });
}
