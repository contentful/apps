import { getUrls, transformResult } from './helpers';
import { TmdbItem } from './types/tmdb';

describe('Transforming the result', () => {
  it('transforms a movie result', () => {
    const result: TmdbItem = {
      id: 1,
      title: 'The Movie',
      poster_path: '/poster.jpg'
    };
    const transformed = transformResult('https://example.com')(result);
    expect(transformed).toEqual({
      urn: '1',
      name: 'The Movie',
      image: {
        url: 'https://image.tmdb.org/t/p/w200/poster.jpg'
      },
      externalUrl: 'https://example.com/1'
    });
  });

  it('transforms a person result', () => {
    const result: TmdbItem = {
      id: 2,
      name: 'A Person',
      profile_path: '/profile.jpg'
    };
    const transformed = transformResult('https://example.com')(result);
    expect(transformed).toEqual({
      urn: '2',
      name: 'A Person',
      image: {
        url: 'https://image.tmdb.org/t/p/w200/profile.jpg'
      },
      externalUrl: 'https://example.com/2'
    });
  });
});

describe('Getting the URLs', () => {
  it('returns correct URLS for a movie', () => {
    const urls = getUrls('TMDB:Movie', {
      query: 'The Movie',
      page: '2',
      urns: ['urn:123', 'urn:456']
    });
    expect(urls).toEqual({
      prefixUrl: 'https://www.themoviedb.org/movie',
      searchUrl:
        'https://api.themoviedb.org/3/search/movie?query=The%20Movie&include_adult=false&language=en-US&page=2',
      lookupUrls: [
        'https://api.themoviedb.org/3/movie/urn:123?language=en-US',
        'https://api.themoviedb.org/3/movie/urn:456?language=en-US'
      ],
      trendingUrl:
        'https://api.themoviedb.org/3/trending/movie/day?language=en-US'
    });
  });

  it('returns correct URLS for a person', () => {
    const urls = getUrls('TMDB:Person', {
      query: 'A Person?',
      page: '7',
      urns: ['urn:123', 'urn:456']
    });
    expect(urls).toEqual({
      prefixUrl: 'https://www.themoviedb.org/person',
      searchUrl:
        'https://api.themoviedb.org/3/search/person?query=A%20Person%3F&include_adult=false&language=en-US&page=7',
      lookupUrls: [
        'https://api.themoviedb.org/3/person/urn:123?language=en-US',
        'https://api.themoviedb.org/3/person/urn:456?language=en-US'
      ],
      trendingUrl:
        'https://api.themoviedb.org/3/trending/person/day?language=en-US'
    });
  });
});
