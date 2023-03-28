import { BASE_URL, getExternalUrl, encodeDataFiltersParameters } from './externalUrlHelpers';

const mockPropertySegment = `/pabc123/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..seldim%3D%5B%22unifiedPagePathScreen%22%5D`;
const mockPagePathSegment = `%26_r..dataFilters%3D%5B%7B%22type%22:1,%22fieldName%22:%22unifiedPagePathScreen%22,%22evaluationType%22:1,%22expressionList%22:%5B%22%2Fen-US%2Fsearch%22%5D,%22complement%22:false,%22isCaseSensitive%22:true,%22expression%22:%22%22%7D%5D`;
const mockDateSegment = `%26_u.comparisonOption%3Ddisabled%26_u.date00%3D20230326%26_u.date01%3D20230327`;
const mockFinalSegment = `&r=all-pages-and-screens&ruid=all-pages-and-screens,life-cycle,engagement&collectionId=life-cycle`;

describe('externalUrlHelpers', () => {
  it('generates the correct URL with params', () => {
    const result = getExternalUrl('abc123', {
      pagePath: '/en-US/search',
      startEndDates: {
        start: '2023-03-26',
        end: '2023-03-27',
      },
    });

    expect(result).toEqual(
      `${BASE_URL}${mockPropertySegment}${mockPagePathSegment}${mockDateSegment}${mockFinalSegment}`
    );
  });

  it('generates the default base URL without params', () => {
    const result = getExternalUrl();

    expect(result).toEqual(BASE_URL);
  });

  it('generates the property report URL with no additional filters', () => {
    const result = getExternalUrl('abc123');

    expect(result).toEqual(`${BASE_URL}${mockPropertySegment}${mockFinalSegment}`);
  });

  it('generates the property report URL with only a page path filter', () => {
    const result = getExternalUrl('abc123', {
      pagePath: '/en-US/search',
    });

    expect(result).toEqual(
      `${BASE_URL}${mockPropertySegment}${mockPagePathSegment}${mockFinalSegment}`
    );
  });

  it('generates the property report URL with only a date filter', () => {
    const result = getExternalUrl('abc123', {
      startEndDates: {
        start: '2023-03-26',
        end: '2023-03-27',
      },
    });

    expect(result).toEqual(
      `${BASE_URL}${mockPropertySegment}${mockDateSegment}${mockFinalSegment}`
    );
  });

  it('encodes the correct characters', () => {
    const result = encodeDataFiltersParameters('{}[]""=');

    expect(result).toEqual('%7B%7D%5B%5D%22%22%3D');
  });
});
