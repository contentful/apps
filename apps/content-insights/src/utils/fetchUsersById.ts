import { BaseAppSDK } from '@contentful/app-sdk';
import type { UserProps } from 'contentful-management';

export async function fetchUsersById(sdk: BaseAppSDK, userIds: string[]): Promise<UserProps[]> {
  if (userIds.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(new Set(userIds));

  const results = await Promise.allSettled(
    uniqueIds.map((id) =>
      sdk.cma.user.getForSpace({
        spaceId: sdk.ids.space,
        userId: id,
      })
    )
  );

  const successfulUsers: UserProps[] = [];
  const errors: unknown[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      successfulUsers.push(result.value);
    } else {
      errors.push(result.reason);
    }
  });

  if (successfulUsers.length === 0 && errors.length > 0) {
    const firstError = errors[0] as { message?: string } | undefined;
    const errorMessage =
      firstError && firstError.message ? firstError.message : 'Error fetching users';
    console.error('All users failed to fetch:', errorMessage);
    throw new Error(errorMessage);
  }

  if (errors.length > 0) {
    console.error('Some users failed to fetch:', errors);
  }

  return successfulUsers;
}
