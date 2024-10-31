import { useContentfulUsers } from '~/hooks/useContentfulUsers';

/**
 * @param data array of objects with userId
 * @returns array of objects with user object
 */
export function useWithContentfulUsers<T extends { userId: string }>(data: T[]) {
  const {
    data: users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useContentfulUsers([...new Set(data.map((entry) => entry.userId))]);

  const dataWithUsers = data.map((entry) => {
    const user = users?.find((user) => user.sys.id === entry.userId);
    return {
      ...entry,
      user,
    };
  });

  return {
    data: dataWithUsers,
    users,
    isUsersLoading,
    usersError,
  };
}
