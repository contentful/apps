import { LocaleProps, EntryProps, PlainClientAPI, SysLink } from 'contentful-management';
import { Action, ActionType, EntryActivity, EntryEvent, Topic } from '../types';
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

  // we can't get the space name for now
  const spaceName = 'TODO: Space name';

  const action = topicToAction(topic);
  const actorName = await computeActorName(entry, action, cma);

  return {
    spaceName,
    contentTypeName,
    entryTitle,
    entryId,
    spaceId,
    contentTypeId,
    action,
    actorName,
    eventDatetime,
  };
};

const topicToAction = (topic: Topic): Action => TOPIC_ACTION_MAP[topic];
const actionToActionType = (action: Action): ActionType => {
  switch (action) {
    case 'created':
      return 'creation';
    case 'published':
      return 'publication';
    case 'archived':
    case 'unarchived':
    case 'unpublished':
      return 'update';
    case 'deleted':
      return 'deletion';
  }
};

const computeActorName = async (
  entry: EntryProps,
  action: Action,
  cma: PlainClientAPI
): Promise<string> => {
  const UNKNOWN_USER = 'A space user';
  const actionType = actionToActionType(action);

  const {
    sys: {
      space: {
        sys: { id: spaceId },
      },
    },
  } = entry;

  let actor: SysLink | undefined;
  if (actionType == 'creation') {
    actor = entry.sys.createdBy;
  } else if (actionType == 'update') {
    actor = entry.sys.updatedBy;
  } else if (actionType == 'publication') {
    actor = entry.sys.publishedBy;
  } else if (actionType == 'deletion') {
    actor = entry.sys.deletedBy;
  }

  if (!actor) return UNKNOWN_USER;

  if (actor.sys.linkType == 'User') {
    const {
      sys: { id: userId },
    } = actor;
    let user;
    try {
      user = await cma.user.getForSpace({ spaceId, userId });
    } catch (e) {
      // TODO figure out how to access the space user API (currently erroring)
      console.log({ errorMessage: (e as Error).message, spaceId, userId });
      return UNKNOWN_USER;
    }
    return `${user.firstName} ${user.lastName}`;
  } else {
    // it could be an AppDefinition or something? For now let's just return
    // what type of thing it is to be slightly more useful
    return actor.sys.linkType;
  }
};

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
