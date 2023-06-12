export const isValidUrl = (urlString: string) => {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch (e) {
    return false;
  }

  return url.protocol === 'https:';
};
