import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import { AppInstallationParameters } from '../../functions/types/common';
import {
  TmdbItem,
  TmdbLookupResponse,
  TmdbSearchResponse
} from '../../functions/types/tmdb';

export const context = {} as any;

type SearchEvent = Parameters<
  FunctionEventHandler<'resources.search', AppInstallationParameters>
>[0];

type LookupEvent = Parameters<
  FunctionEventHandler<'resources.lookup', AppInstallationParameters>
>[0];

export const testSearchEvent: SearchEvent = {
  type: 'resources.search',
  resourceType: 'TMDB:Person',
  query: 'test query'
};

export const testLookupEvent: LookupEvent = {
  type: 'resources.lookup',
  resourceType: 'TMDB:Person',
  lookupBy: { urns: ['15', '22'] }
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
