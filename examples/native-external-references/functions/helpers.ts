import type { FunctionEventContext } from '@contentful/functions-types';
import { AppInstallationParameters, Scalar } from './types/common';
import {
  TmdbItem,
  TmdbLookupResponse,
  TmdbSearchResponse,
  Resource
} from './types/tmdb';

export const transformResult =
  (externalUrlPrefix: string) =>
  (result: TmdbItem): Resource => {
    const imageUrl =
      'poster_path' in result ? result.poster_path : result.profile_path;
    const name = 'title' in result ? result.title : result.name;

    return {
      urn: String(result.id),
      name,
      ...(imageUrl && {
        image: {
          url: `https://image.tmdb.org/t/p/w200${imageUrl}`
        }
      }),
      externalUrl: `${externalUrlPrefix}/${result.id}`
    };
  };

export const fetchApi = async <
  T extends TmdbSearchResponse | TmdbLookupResponse | undefined
>(
  url: string,
  context: FunctionEventContext<AppInstallationParameters>
) => {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${context.appInstallationParameters.tmdbAccessToken}`
    }
  };

  return fetch(url, options)
    .then((res: Response) => res.json())
    .then((json: T) => {
      console.log('Returned Object from TMDB API:', json);
      return json;
    })
    .catch((err: Error) => {
      console.error('error:' + err);
      throw err;
    });
};

type Params = {
  query?: string;
  page?: string;
  urns?: Scalar | Scalar[];
};

export const getUrls = (
  resourceType: string,
  { query = '', page = '', urns = [] }: Params
) => {
  const type = resourceType === 'TMDB:Movie' ? 'movie' : 'person';
  const encodedQuery = encodeURIComponent(query);
  const urnsArray = Array.isArray(urns) ? urns : [urns];

  return {
    prefixUrl: `https://www.themoviedb.org/${type}`,
    searchUrl: `https://api.themoviedb.org/3/search/${type}?query=${encodedQuery}&include_adult=false&language=en-US&page=${page}`,
    trendingUrl: `https://api.themoviedb.org/3/trending/${type}/day?language=en-US`,
    lookupUrls: urnsArray.map(
      (urn) => `https://api.themoviedb.org/3/${type}/${urn}?language=en-US`
    )
  };
};
