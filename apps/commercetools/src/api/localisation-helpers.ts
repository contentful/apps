import type { LocalizedString } from '@commercetools/platform-sdk';

const browserLanguages = Array.from(
  new Set(navigator.languages.flatMap((language) => [language, language.replace(/-.*$/, '')]))
);

export function getLocalizedValue(value: LocalizedString = {}) {
  const preferredLanguage = browserLanguages.find((language) => language in value);

  if (preferredLanguage && preferredLanguage in value) {
    return value[preferredLanguage];
  }

  const [firstLocale] = Object.keys(value);

  if (firstLocale && firstLocale in value) {
    return value[firstLocale];
  }

  return undefined;
}
