import { createEventAdapter } from '@slack/events-api';
import { SlackConfiguration } from '../../config';
import { AuthTokenRepository } from '../auth-token';
import { handleTokensRevokedEvent } from './tokens-revoked';
import { EventMap, EventName } from './types';

const EVENT_HANDLERS: Record<
  keyof EventMap,
  (authTokenRepository: AuthTokenRepository, event: EventMap[keyof EventMap]) => Promise<void>
> = {
  [EventName.TokensRevoked]: handleTokensRevokedEvent,
};

export function createSlackEventsMiddleware(
  config: SlackConfiguration,
  authTokenRepository: AuthTokenRepository
) {
  const slackEvents = createEventAdapter(config.signingSecret, {
    includeBody: true,
  });

  for (const [name, handler] of Object.entries(EVENT_HANDLERS)) {
    slackEvents.on(name, (_, event) => handler(authTokenRepository, event));
  }

  return slackEvents.requestListener();
}
