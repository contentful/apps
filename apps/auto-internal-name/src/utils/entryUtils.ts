export const isEntryRecentlyCreated = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  const now = new Date();
  const timeDiff = now.getTime() - created.getTime();
  const secondsDiff = timeDiff / 1000;

  return secondsDiff < 30;
};
