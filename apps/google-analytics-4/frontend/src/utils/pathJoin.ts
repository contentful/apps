export const pathJoin = (...parts: (string | undefined)[]): string => {
  return parts
    .map((part) => (part || '').trim().replace(/(^[/]*|[/]*$)/g, ''))
    .filter((part) => part.length)
    .join('/');
};
