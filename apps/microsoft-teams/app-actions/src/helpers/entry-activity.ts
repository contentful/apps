import { LocaleProps, EntryProps, PlainClientAPI } from 'contentful-management';
import { Action, EntryActivity, EntryEvent, Topic } from '../types';
import { TOPIC_ACTION_MAP } from '../constants';

export const buildEntryActivity = async (
  entryEvent: EntryEvent,
  cma: PlainClientAPI,
  cmaHost: string
): Promise<EntryActivity> => {
  const { entry, topic, eventDatetime } = entryEvent;

  const contentTypeId = entry.sys.contentType.sys.id;

  const { name: contentTypeName, displayField } = await cma.contentType.get({ contentTypeId });
  const localeCollection = await cma.locale.getMany({});

  const entryTitle = computeEntryTitle(entry, displayField, localeCollection.items);

  const action = topicToAction(topic);

  const entryUrl = computeEntryUrl(entry, cmaHost);

  return {
    contentTypeName,
    entryTitle,
    action,
    eventDatetime,
    entryUrl,
  };
};

const topicToAction = (topic: Topic): Action => TOPIC_ACTION_MAP[topic];

const computeEntryTitle = (
  entry: EntryProps,
  displayField: string | null,
  locales: LocaleProps[]
): string => {
  const NO_ENTRY_TITLE = `Entry ID ${entry.sys.id}`;
  if (!displayField) return NO_ENTRY_TITLE;

  const defaultLocaleCode = computeDefaultLocaleCode(locales);

  // the entry here could be a DeletedEntry which is lacking a fields attribute. We will do a runtime
  // check here to catch this
  const entryTitleField = entry.fields && entry.fields[displayField];

  if (!entryTitleField) return NO_ENTRY_TITLE;

  return entryTitleField[defaultLocaleCode] || NO_ENTRY_TITLE;
};

const computeDefaultLocaleCode = (locales: LocaleProps[]): string => {
  const defaultLocale = locales.find((locale) => locale.default);
  if (!defaultLocale) throw new Error('No default locale found in space');
  return defaultLocale.code;
};

const computeEntryUrl = (entry: EntryProps, cmaHost: string): string => {
  const CONTENTFUL_SITE_URL = 'app.contentful.com';
  const CONTENTFUL_EU_SITE_URL = 'app.eu.contentful.com';

  const spaceId = entry.sys.space.sys.id;
  const environmentId = entry.sys.environment.sys.id;
  const entryId = entry.sys.id;
  const webapp = cmaHost.includes('.eu.') ? CONTENTFUL_EU_SITE_URL : CONTENTFUL_SITE_URL;
  const url =
    environmentId === 'master'
      ? `https://${webapp}/spaces/${spaceId}/entries/${entryId}`
      : `https://${webapp}/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;

  return url;
};
