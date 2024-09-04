import {
  FunctionEventContext,
  FunctionEventHandler
} from '@contentful/node-apps-toolkit';
import { fetchApi, getUrls, transformResult } from './helpers';
import { AppInstallationParameters } from './types/common';
import { TmdbLookupResponse } from './types/tmdb';

const fetchLookup = async (
  urls: string[],
  prefix: string,
  context: FunctionEventContext<AppInstallationParameters>
) => {
  return (
    /*
     * TMDB API does not support bulk lookup requests
     * Therefore we are making multiple requests to fetch each item
     * If you'd like to implement pagination for the results, you can do it here
     */
    Promise.all(
      urls.map((url) =>
        fetchApi<TmdbLookupResponse>(url, context).then((response) =>
          transformResult(prefix)(response)
        )
      )
    )
      .then((items) => ({ items, pages: {} }))
      .catch((error) => ({ items: [], pages: {} }))
  );
};

export const lookupHandler: FunctionEventHandler<
  'resources.lookup',
  AppInstallationParameters
> = async (event, context) => {
  const { lookupUrls, prefixUrl } = getUrls(event.resourceType, {
    urns: event.lookupBy.urns
  });

  return fetchLookup(lookupUrls, prefixUrl, context);
};
