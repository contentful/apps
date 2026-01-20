export const formatUserName = (
  user: { id: string; firstName?: string; lastName?: string } | null
): string => {
  if (!user) return '—';
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  return `${firstName} ${lastName}`.trim() || '—';
};
