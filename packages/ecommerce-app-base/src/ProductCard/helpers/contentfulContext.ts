import { ContentfulContext, ContentfulContextHeaders } from '../types';
import { KnownAppSDK, locations } from '@contentful/app-sdk';
import { upperFirst } from 'lodash';

const Locations = [
  locations.LOCATION_APP_CONFIG,
  locations.LOCATION_ENTRY_FIELD,
  locations.LOCATION_ENTRY_EDITOR,
  locations.LOCATION_DIALOG,
  locations.LOCATION_ENTRY_SIDEBAR,
  locations.LOCATION_PAGE,
  locations.LOCATION_HOME,
];

export const contentfulContext = (sdk: KnownAppSDK): ContentfulContext => {
  return {
    ...sdk.ids,
    location: Locations.find((location) => sdk.location.is(location)),
  };
};

export const contentfulContextHeaders = (sdk: KnownAppSDK): ContentfulContextHeaders => {
  const headers: ContentfulContextHeaders = {};
  for (const [key, value] of Object.entries(contentfulContext(sdk))) {
    const headerKey = `X-Contentful-${upperFirst(key)}` as keyof ContentfulContextHeaders;
    headers[headerKey] = value;
  }

  return headers;
};
