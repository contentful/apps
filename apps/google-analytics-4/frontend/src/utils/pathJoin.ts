const trimAndRemoveSlashes = (item: string) => {
  return item.trim().replace(/(^[/]*|[/]*$)/g, '');
};

const handlePartsByType = (part: string | object | undefined) => {
  let result = '';

  if (typeof part === 'string') {
    result = trimAndRemoveSlashes(part);
  }

  if (Array.isArray(part)) {
    result = part.map(trimAndRemoveSlashes).join('/');
  }

  return result;
};

export const pathJoin = (...parts: (string | object | undefined)[]): string => {
  return parts
    .map(handlePartsByType)
    .filter((part) => part.length)
    .join('/');
};
