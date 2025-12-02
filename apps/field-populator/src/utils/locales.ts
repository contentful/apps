export type SimplifiedLocale = { code: string; name: string };

export const mapLocaleNamesToSimplifiedLocales = (
  localeNames: Record<string, string>
): SimplifiedLocale[] => {
  return Object.keys(localeNames).map((key) => ({
    code: key,
    name: localeNames[key],
  }));
};

export const normalizeLocaleCode = (code: string) => {
  return code.toLowerCase().replace(/\s/g, '-');
};
