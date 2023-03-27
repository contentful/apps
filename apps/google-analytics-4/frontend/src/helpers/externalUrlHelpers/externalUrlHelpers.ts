import { StartEndDates } from 'types';

export const getExternalUrl = (
  propertyId: string,
  pagePath: string,
  startEndDates: StartEndDates
) => {
  // Base Google Analytics URL
  const BASE_URL = 'https://analytics.google.com/analytics/web/#';

  if (!propertyId || !pagePath || !startEndDates.start || !startEndDates.end) {
    return BASE_URL;
  }

  const propertyIdSegment = `/p${propertyId}/reports/explorer?params=`;

  const explorerCardParams = 'unifiedPagePathScreen';
  const explorerCardSegment = encodeURIComponent(
    `_u..nav=maui&_r.explorerCard..seldim=["${explorerCardParams}"]&`
  );

  const dataFiltersParams = {
    type: 1,
    fieldName: 'unifiedPagePathScreen',
    evaluationType: 1,
    expressionList: [`${encodeURIComponent(pagePath)}`],
    complement: false,
    isCaseSensitive: true,
    expression: '',
  };

  // encodeURIComponent encodes too many characters for this part of the URL, so using custom encoding function
  const dataFiltersSegment = `_r..dataFilters${encodeDataFiltersParameters(
    `=[${JSON.stringify(dataFiltersParams)}]`
  )}`;

  const dateParams = {
    start: formatDateParams(startEndDates.start),
    end: formatDateParams(startEndDates.end),
  };
  const dateSegment = encodeURIComponent(
    `&_u.comparisonOption=disabled&_u.date00=${dateParams.start}&_u.date01=${dateParams.end}`
  );

  const finalSegment = `&r=all-pages-and-screens&ruid=all-pages-and-screens,life-cycle,engagement&collectionId=life-cycle`;

  return `${BASE_URL}${propertyIdSegment}${explorerCardSegment}${dataFiltersSegment}${dateSegment}${finalSegment}`;
};

export const encodeDataFiltersParameters = (str: string) => {
  // Encodes these characters: {}[]"=
  // Manually encodes specified characters by getting the unicode value, converting to hexadecimal string, then converting to uppercase
  const encodedStr = str.replace(
    /[{}[\]"=]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );

  return encodedStr;
};

const formatDateParams = (dateString: string) => {
  // Dates need to be formatted from YYYY-MM-DD to YYYYMMDD and month must be zero-padded
  const splitDate = dateString.split('-');
  const year = splitDate[0];
  const month = splitDate[1].length === 1 ? `0${splitDate[1]}` : splitDate[1];
  const day = splitDate[2];

  return `${year}${month}${day}`;
};
