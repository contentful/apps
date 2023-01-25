import { SlackAppEventKey } from './types';

export const ACCEPTED_EVENTS = [
  SlackAppEventKey.UNPUBLISHED,
  SlackAppEventKey.PUBLISH,
  SlackAppEventKey.CREATED,
  SlackAppEventKey.DELETED,
];

export const MESSAGE_EMOJI_MAP = {
  [SlackAppEventKey.UNPUBLISHED]: ':cyclone:',
  [SlackAppEventKey.PUBLISH]: ':tada:',
  [SlackAppEventKey.CREATED]: ':large_green_circle:',
  [SlackAppEventKey.DELETED]: ':red_circle:',
};

export const EVENT_TEXT_MAP = {
  [SlackAppEventKey.UNPUBLISHED]: 'unpublished',
  [SlackAppEventKey.PUBLISH]: 'published',
  [SlackAppEventKey.CREATED]: 'created',
  [SlackAppEventKey.DELETED]: 'deleted',
};
