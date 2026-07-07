import type { EntryToCreate } from '@types';

type LocalizedField = EntryToCreate['fields'][string];

// Agent output is in en-US locale, but Contentful expects the space default locale.
export function mapFieldValuesToSpaceDefaultLocale(
  entries: EntryToCreate[],
  spaceDefaultLocale: string,
  agentLocale = 'en-US'
): EntryToCreate[] {
  if (spaceDefaultLocale === agentLocale) {
    return entries;
  }

  return entries.map((entry) =>
    remapEntryFieldsToSpaceLocale(entry, agentLocale, spaceDefaultLocale)
  );
}

function remapEntryFieldsToSpaceLocale(
  entry: EntryToCreate,
  agentLocale: string,
  spaceDefaultLocale: string
): EntryToCreate {
  const remappedFieldPairs: [string, LocalizedField][] = Object.entries(entry.fields).map(
    ([fieldId, localizedValue]) => [
      fieldId,
      remapLocaleKeysOnField(localizedValue, agentLocale, spaceDefaultLocale),
    ]
  );

  const remappedFields = Object.fromEntries(remappedFieldPairs);

  return { ...entry, fields: remappedFields };
}

/**
 * Agent fields use `agentLocale` keys; Contentful create calls need `spaceDefaultLocale`.
 * Only rewrites when the agent locale is present and the space default is not (avoids overwriting).
 */
function remapLocaleKeysOnField(
  localized: LocalizedField,
  agentLocale: string,
  spaceDefaultLocale: string
): LocalizedField {
  const hasAgentKey = agentLocale in localized;
  const hasSpaceDefaultKey = spaceDefaultLocale in localized;
  if (!hasAgentKey || hasSpaceDefaultKey) {
    return localized;
  }

  const { [agentLocale]: valueUnderAgentLocale, ...otherLocaleKeys } = localized;
  return {
    ...otherLocaleKeys,
    [spaceDefaultLocale]: valueUnderAgentLocale,
  };
}
