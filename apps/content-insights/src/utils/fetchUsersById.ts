import { BaseAppSDK } from '@contentful/app-sdk';
import type { UserProps } from 'contentful-management';

export async function fetchUsersById(sdk: BaseAppSDK, userIds: string[]): Promise<UserProps[]> {
  if (userIds.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(new Set(userIds));

  const users = await Promise.all(
    uniqueIds.map((id) =>
      sdk.cma.user.getForSpace({
        spaceId: sdk.ids.space,
        userId: id,
      })
    )
  );

  return users;
}
