import {
  FunctionEventContext,
  FunctionEventHandler
} from '@contentful/node-apps-toolkit';
import { fetchApi, getUrls, transformResult } from './helpers';
import { AppInstallationParameters } from './types/common';
import { TmdbSearchResponse } from './types/tmdb';

const fetchSearch = async (
  url: string,
  prefix: string,
  context: FunctionEventContext<AppInstallationParameters>
) => {
  const tmdbResponse: TmdbSearchResponse = await fetchApi(url, context);

  if (!tmdbResponse) {
    return { items: [], pages: {} };
  }

  return {
    items: tmdbResponse.results.map(transformResult(prefix)),
    pages: {
      nextCursor:
        tmdbResponse.total_pages > tmdbResponse.page
          ? String(tmdbResponse.page + 1)
          : undefined
    }
  };
};

export const searchHandler: FunctionEventHandler<
  'resources.search',
  AppInstallationParameters
> = async (event, context) => {
  const { prefixUrl, searchUrl, trendingUrl } = getUrls(event.resourceType, {
    query: event.query,
    page: event.pages?.nextCursor ?? '1'
  });

  return fetchSearch(
    !event.query ? trendingUrl : searchUrl,
    prefixUrl,
    context
  );
};
