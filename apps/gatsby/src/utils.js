export function isValidUrl(url) {
  const regex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}[\.,:][a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g; // eslint-disable-line no-useless-escape
  return regex.test(url);
}
