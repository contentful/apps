import { PublishButtonAction } from './publish-button-action';

const actionRegistry = {
  '/show-publish': new PublishButtonAction(),
  '/hide-publish': new PublishButtonAction(),
  // Future actions can be registered here
};

export function getAction(command) {
  return actionRegistry[command];
}
