export const build_status_key = '__contentful_build_timestamp__';

export function setInLocalStorage(key: string, value: string | object) {
  if (typeof value === 'object') {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.setItem(key, value);
  }
}

export function getItemLocalStorage(key: string) {
  const item = localStorage.getItem(key);

  if (!item) {
    return;
  }

  return JSON.parse(item);
}
