import { BaseAppSDK } from '@contentful/app-sdk';
import type { UserProps } from 'contentful-management';

export async function fetchUsersById(sdk: BaseAppSDK, userIds: string[]): Promise<UserProps[]> {
  if (userIds.length === 0) {
    return [];
  }

  const allUsers: UserProps[] = [];
  const limit = 100;
  let skip = 0;
  let total = 0;

  try {
    do {
      const response = await sdk.cma.user.getManyForSpace({
        spaceId: sdk.ids.space,
        query: {
          limit,
          skip,
        },
      });

      allUsers.push(...response.items);
      total = response.total;
      skip += response.items.length;
    } while (allUsers.length < total);
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  const idSet = new Set(userIds);
  const filteredUsers = allUsers.filter((user) => idSet.has(user.sys.id));
  return filteredUsers;
}
