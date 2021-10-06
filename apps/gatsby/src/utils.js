export function isValidUrl(url) {
  // eslint-disable-next-line no-useless-escape
  const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}[\.,:][a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;
  return regex.test(url);
}

