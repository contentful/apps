import type { BotAction } from '../types';
import { PublishButtonAction } from './publish-button-action';

const actionRegistry: { [key: string]: BotAction } = {
  '/show-publish': new PublishButtonAction(),
  '/hide-publish': new PublishButtonAction(),
  // Future actions can be registered here
};

export function getAction(command: string): BotAction | undefined {
  return actionRegistry[command];
}
