import type {
  FunctionEvent,
  FunctionEventContext
} from '@contentful/functions-types';
import { searchHandler } from './searchHandler';
import { lookupHandler } from './lookupHandler';
import { AppInstallationParameters } from './types/common';

export const handler = (
  event: FunctionEvent,
  context: FunctionEventContext<AppInstallationParameters>
) => {
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
