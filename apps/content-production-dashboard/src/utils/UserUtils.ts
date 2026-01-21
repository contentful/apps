import { EntryProps, UserProps } from 'contentful-management';
import { Creator } from './types';

export const formatUserName = (user: Creator | null): string => {
  if (!user) return '—';
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  return `${firstName} ${lastName}`.trim() || '—';
};

export function getCreatorFromEntry(
  entry: EntryProps,
  usersMap: Map<string, UserProps>
): Creator | null {
  const creatorId = entry.sys.createdBy?.sys?.id;
  if (!creatorId) {
    return null;
  }

  const user = usersMap.get(creatorId);
  if (user) {
    return {
      id: creatorId,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  return {
    id: creatorId,
  };
}
