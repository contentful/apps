import { lookupHandler } from './lookupHandler';
import * as helpers from './helpers';
import {
  context,
  createTmdbLookupResponse,
  testLookupEvent
} from '../test/mocks';

describe('Lookup handler', () => {
  let mockApi: jest.SpyInstance;

  beforeEach(() => {
    mockApi = jest.spyOn(helpers, 'fetchApi');
  });

  it('returns an empty response if TMDB does not return any results', async () => {
    mockApi.mockImplementation(() => Promise.resolve(undefined));

    const response = await lookupHandler(testLookupEvent, context);
    expect(response).toEqual({ items: [], pages: {} });
  });

  it('returns an empty response if one of TMDB requests fails', async () => {
    mockApi.mockImplementation(() =>
      Promise.resolve(createTmdbLookupResponse())
    );
    mockApi.mockImplementationOnce(() => Promise.resolve(undefined));

    const response = await lookupHandler(testLookupEvent, context);

    expect(response).toEqual({ items: [], pages: {} });
  });

  it('returns a response with populated items', async () => {
    const urns = Array.isArray(testLookupEvent.lookupBy.urns)
      ? testLookupEvent.lookupBy.urns
      : [testLookupEvent.lookupBy.urns];

    mockApi.mockImplementationOnce(() =>
      Promise.resolve(createTmdbLookupResponse(Number(urns[0])))
    );
    mockApi.mockImplementationOnce(() =>
      Promise.resolve(createTmdbLookupResponse(Number(urns[1])))
    );

    const response = await lookupHandler(testLookupEvent, context);

    expect(response).toHaveProperty('items');
    expect(response.items).toEqual([
      {
        urn: '15',
        name: 'John Doe',
        externalUrl: 'https://www.themoviedb.org/person/15',
        image: { url: 'https://image.tmdb.org/t/p/w200/profile15.jpg' }
      },
      {
        urn: '22',
        name: 'John Doe',
        externalUrl: 'https://www.themoviedb.org/person/22',
        image: { url: 'https://image.tmdb.org/t/p/w200/profile22.jpg' }
      }
    ]);
  });
});
