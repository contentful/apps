import {
  FunctionEventHandler,
  FunctionEventType
} from '@contentful/node-apps-toolkit';
import { searchHandler } from './searchHandler';
import { lookupHandler } from './lookupHandler';
import { AppInstallationParameters } from './types/common';

type EventHandler = FunctionEventHandler<
  FunctionEventType,
  AppInstallationParameters
>;

export const handler: EventHandler = (event, context) => {
  if (!context.appInstallationParameters.tmdbAccessToken) {
    throw new Error(
      `'tmdbAccessToken' installation parameter must be defined.`
    );
  }

  switch (event.type) {
    case 'resources.search': {
      return searchHandler(event, context);
    }
    case 'resources.lookup': {
      return lookupHandler(event, context);
    }
    default:
      throw new Error('Bad Request');
  }
};
