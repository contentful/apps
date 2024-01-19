import { EntryProps, PlainClientAPI, SysLink } from 'contentful-management';
import { Action, ActionType, EntryActivity, Topic } from '../types';
import { TOPIC_ACTION_MAP } from '../constants';

interface EntryEvent {
  entry: EntryProps;
  topic: Topic;
  eventDatetime: string;
}

// comment
export const buildEntryActivity = async (
  entryEvent: EntryEvent,
  cma: PlainClientAPI
): Promise<EntryActivity> => {
  const { entry, topic, eventDatetime } = entryEvent;
  const contentTypeId = entry.sys.contentType.sys.id;
  const { name: contentTypeName, displayField } = await cma.contentType.get({ contentTypeId });

  const entryTitle = entry.fields[displayField] || 'No display field specified';
  const entryId = entry.sys.id;
  const spaceId = entry.sys.space.sys.id;

  // we can't get the space name
  const spaceName = 'How can we get this?';

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
    at: eventDatetime,
  };
};

const topicToAction = (topic: Topic): Action => TOPIC_ACTION_MAP[topic];
const actionToActionType = (action: Action): ActionType => {
  switch (action) {
    case 'created':
      return 'creation';
    case 'saved':
    case 'auto saved':
    case 'archived':
    case 'unarchived':
    case 'published':
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
  const actionType = actionToActionType(action);

  let actor: SysLink | undefined;
  if (actionType == 'creation') {
    actor = entry.sys.createdBy;
  } else if (actionType == 'update') {
    actor = entry.sys.updatedBy;
  } else if (actionType == 'deletion') {
    actor = entry.sys.deletedBy;
  }

  if (!actor) return 'Unknown';

  if (actor.sys.linkType == 'User') {
    const user = await cma.user.getForSpace({ userId: actor.sys.id });
    return `${user.firstName} ${user.lastName}`;
  } else {
    // it could be an AppDefinition or something? For now let's just return
    // what type of thing it is to be slightly more useful
    return actor.sys.linkType;
  }
};
