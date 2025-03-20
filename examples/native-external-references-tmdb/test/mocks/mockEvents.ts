import {
  FunctionEventHandler,
  FunctionTypeEnum
} from '@contentful/node-apps-toolkit';
import { AppInstallationParameters } from '../../functions/types/common';
import {
  TmdbItem,
  TmdbLookupResponse,
  TmdbSearchResponse
} from '../../functions/types/tmdb';

export const context = {} as any;

type SearchEvent = Parameters<
  FunctionEventHandler<
    FunctionTypeEnum.ResourcesSearch,
    AppInstallationParameters
  >
>[0];

type LookupEvent = Parameters<
  FunctionEventHandler<
    FunctionTypeEnum.ResourcesLookup,
    AppInstallationParameters
  >
>[0];

export const testSearchEvent: SearchEvent = {
  type: FunctionTypeEnum.ResourcesSearch,
  resourceType: 'TMDB:Person',
  query: 'test query',
  limit: 5
};

export const testLookupEvent: LookupEvent = {
  type: FunctionTypeEnum.ResourcesLookup,
  resourceType: 'TMDB:Person',
  lookupBy: { urns: ['15', '22'] },
  limit: 5
};

const createSingleTmdbResponse = (id: number): TmdbItem => ({
  id,
  name: 'John Doe',
  profile_path: `/profile${id}.jpg`
});

export const createTmdbSearchResponse = ({
  page = 0
} = {}): TmdbSearchResponse => ({
  results: [createSingleTmdbResponse(1), createSingleTmdbResponse(2)],
  total_pages: 2,
  page
});

export const createTmdbLookupResponse = (id = 1): TmdbLookupResponse =>
  createSingleTmdbResponse(id);
