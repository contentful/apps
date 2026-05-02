const trimAndRemoveSlashes = (item: string | number) => {
  return String(item).trim().replace(/(^[/]*|[/]*$)/g, '');
};

type PathPart = string | number | object | undefined;

const handlePartsByType = (part: PathPart) => {
  let result = '';

  if (typeof part === 'string' || typeof part === 'number') {
    result = trimAndRemoveSlashes(part);
  }

  if (Array.isArray(part)) {
    result = part.map(trimAndRemoveSlashes).join('/');
  }

  return result;
};

export const pathJoin = (...parts: PathPart[]): string => {
  return parts
    .map(handlePartsByType)
    .filter((part) => part.length)
    .join('/');
};
