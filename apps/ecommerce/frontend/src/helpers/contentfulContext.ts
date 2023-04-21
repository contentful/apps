import { ContentfulContext } from '../types';
import { KnownSDK, locations } from '@contentful/app-sdk';

const Locations = [
  locations.LOCATION_APP_CONFIG,
  locations.LOCATION_ENTRY_FIELD,
  locations.LOCATION_ENTRY_EDITOR,
  locations.LOCATION_DIALOG,
  locations.LOCATION_ENTRY_SIDEBAR,
  locations.LOCATION_PAGE,
  locations.LOCATION_HOME,
];

export const contentfulContext = (sdk: KnownSDK): ContentfulContext => {
  return {
    ...sdk.ids,
    location: Locations.find((location) => sdk.location.is(location)),
  };
};
