import { searchHandler } from './searchHandler';
import * as helpers from './helpers';
import {
  context,
  createTmdbSearchResponse,
  testSearchEvent
} from '../test/mocks';

describe('Search handler', () => {
  let mockApi: jest.SpyInstance;

  beforeEach(() => {
    mockApi = jest.spyOn(helpers, 'fetchApi');
  });

  it('returns an empty response if TMDB does not return any results', async () => {
    mockApi.mockImplementation(() => Promise.resolve(undefined));

    const response = await searchHandler(testSearchEvent, context);
    expect(response).toEqual({ items: [], pages: {} });
  });

  it('returns a response with populated items', async () => {
    const tmdbResponse = createTmdbSearchResponse();
    mockApi.mockImplementation(() => Promise.resolve(tmdbResponse));

    const response = await searchHandler(testSearchEvent, context);

    expect(response).toHaveProperty('items');
    expect(response.items).toHaveLength(tmdbResponse.results.length);
    expect(response.items).toEqual([
      {
        urn: '1',
        name: 'John Doe',
        externalUrl: 'https://www.themoviedb.org/person/1',
        image: { url: 'https://image.tmdb.org/t/p/w200/profile1.jpg' }
      },
      {
        urn: '2',
        name: 'John Doe',
        externalUrl: 'https://www.themoviedb.org/person/2',
        image: { url: 'https://image.tmdb.org/t/p/w200/profile2.jpg' }
      }
    ]);
  });

  it('returns a response with next cursor when requested page is not the last one', async () => {
    mockApi.mockImplementation(() =>
      Promise.resolve(createTmdbSearchResponse({ page: 0 }))
    );

    const response = await searchHandler(testSearchEvent, context);

    expect(response).toHaveProperty('pages.nextCursor');
    expect(response.pages.nextCursor).toBe('1');
  });

  it('returns a response without next cursor when requested page is the last one', async () => {
    mockApi.mockImplementation(() =>
      Promise.resolve(createTmdbSearchResponse({ page: 2 }))
    );

    const response = await searchHandler(testSearchEvent, context);

    expect(response).toHaveProperty('pages.nextCursor');
    expect(response.pages.nextCursor).toBeUndefined();
  });
});
