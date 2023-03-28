import { StartEndDates } from 'types';

export const BASE_URL = 'https://analytics.google.com/analytics/web/#';
const PAGE_PATH_VIEW = 'unifiedPagePathScreen';

export const getExternalUrl = (
  propertyId?: string,
  reportFilterOptions?: {
    pagePath?: string;
    startEndDates?: StartEndDates;
  }
) => {
  if (!propertyId) {
    return BASE_URL;
  }

  const propertyIdSegment = `/p${propertyId}/reports/explorer?params=`;

  const explorerCardSegment = encodeURIComponent(
    `_u..nav=maui&_r.explorerCard..seldim=["${PAGE_PATH_VIEW}"]`
  );

  let dataFiltersParams, dateParams;

  if (reportFilterOptions) {
    dataFiltersParams = reportFilterOptions.pagePath && {
      type: 1,
      fieldName: PAGE_PATH_VIEW,
      evaluationType: 1,
      expressionList: [`${encodeURIComponent(reportFilterOptions.pagePath)}`],
      complement: false,
      isCaseSensitive: true,
      expression: '',
    };

    if (reportFilterOptions.startEndDates) {
      dateParams = reportFilterOptions.startEndDates.start &&
        reportFilterOptions.startEndDates.end && {
          start: formatDateParams(reportFilterOptions.startEndDates.start),
          end: formatDateParams(reportFilterOptions.startEndDates.end),
        };
    }
  }

  // encodeURIComponent encodes too many characters for data filters, so using custom encoding function
  const dataFiltersSegment = dataFiltersParams
    ? `${encodeURIComponent('&_r..dataFilters')}${encodeDataFiltersParameters(
        `=[${JSON.stringify(dataFiltersParams)}]`
      )}`
    : '';

  const dateSegment = dateParams
    ? encodeURIComponent(
        `&_u.comparisonOption=disabled&_u.date00=${dateParams.start}&_u.date01=${dateParams.end}`
      )
    : '';

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
  const month = splitDate[1] ? (splitDate[1].length === 1 ? `0${splitDate[1]}` : splitDate[1]) : '';
  const day = splitDate[2] ?? '';

  return `${year}${month}${day}`;
};
