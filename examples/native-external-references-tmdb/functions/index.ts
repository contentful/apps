import {
  FunctionEvent,
  FunctionEventContext
} from '@contentful/node-apps-toolkit';
import { searchHandler } from './searchHandler';
import { lookupHandler } from './lookupHandler';
import { AppInstallationParameters } from './types/common';
import {
  ResourcesLookupRequest,
  ResourcesSearchRequest
} from './types/handler';

type Event = FunctionEvent | ResourcesSearchRequest | ResourcesLookupRequest;

export const handler = (
  event: Event,
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
