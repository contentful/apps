export const getExternalUrl = (propertyId: string, pagePath: string) => {
  // Base Google Analytics URL
  const BASE_URL = 'https://analytics.google.com/analytics/web/#';

  if (propertyId && pagePath) {
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

    const finalSegment = `&r=all-pages-and-screens&ruid=all-pages-and-screens,life-cycle,engagement&collectionId=life-cycle`;

    return `${BASE_URL}${propertyIdSegment}${explorerCardSegment}${dataFiltersSegment}${finalSegment}`;
  }

  return BASE_URL;
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
