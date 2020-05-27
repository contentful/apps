export function replaceLocale(
  spaceTemplate: Record<string, any>,
  defaultLocale: string
): ReturnType<typeof JSON.parse> {
  const templateLocale = spaceTemplate.locales.find(
    (locale) => locale.default === true
  );
  const regex = new RegExp(templateLocale.code, 'g');

  return JSON.parse(
    JSON.stringify(spaceTemplate).replace(regex, defaultLocale)
  );
}

export function resetCounters(
  spaceTemplate: Record<string, any>
): ReturnType<typeof JSON.parse> {
  const publishedVersion = new RegExp('"publishedVersion":[0-9]+', 'g');
  const publishedCounter = new RegExp('"publishedCounter":[0-9]+', 'g');
  const version = new RegExp('"version":[0-9]+', 'g');

  return JSON.parse(
    JSON.stringify(spaceTemplate)
      .replace(publishedVersion, '"publishedVersion":0')
      .replace(publishedCounter, '"publishedCounter":0')
      .replace(version, '"version":0')
  );
}

export function getContentTypeSchemaById(
  id: string,
  schema: Record<string, any>[]
): Record<string, any> {
  return schema.find((contentType) => contentType.sys.id === id) || null;
}
