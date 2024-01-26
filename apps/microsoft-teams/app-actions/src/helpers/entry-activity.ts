import { LocaleProps, EntryProps, PlainClientAPI } from 'contentful-management';
import { Action, EntryActivity, EntryEvent, Topic } from '../types';
import { TOPIC_ACTION_MAP } from '../constants';

export const buildEntryActivity = async (
  entryEvent: EntryEvent,
  cma: PlainClientAPI
): Promise<EntryActivity> => {
  const { entry, topic, eventDatetime } = entryEvent;

  const entryId = entry.sys.id;
  const spaceId = entry.sys.space.sys.id;
  const contentTypeId = entry.sys.contentType.sys.id;

  const { name: contentTypeName, displayField } = await cma.contentType.get({ contentTypeId });
  const localeCollection = await cma.locale.getMany({});

  const entryTitle = computeEntryTitle(entry, displayField, localeCollection.items);

  const action = topicToAction(topic);

  return {
    contentTypeName,
    entryTitle,
    entryId,
    spaceId,
    contentTypeId,
    action,
    eventDatetime,
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
  const entryTitleField = entry.fields[displayField];

  if (!entryTitleField) return NO_ENTRY_TITLE;

  return entryTitleField[defaultLocaleCode] || NO_ENTRY_TITLE;
};

const computeDefaultLocaleCode = (locales: LocaleProps[]): string => {
  const defaultLocale = locales.find((locale) => locale.default);
  if (!defaultLocale) throw new Error('No default locale found in space');
  return defaultLocale.code;
};
