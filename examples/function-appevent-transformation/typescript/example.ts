import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppEventEntry,
  AppEventRequest,
  FunctionEventContext,
} from '@contentful/node-apps-toolkit/lib/requests/typings';

const geocodeApi = 'https://maps.googleapis.com/maps/api/geocode/json';

async function geocode(lat: number, long: number, apiKey: string) {
  const url = `${geocodeApi}?latlng=${lat},${long}&key=${apiKey}`;
  const response = await fetch(url);
  const result = await response.json();
  if (result.results.length > 0) {
    return result.results[0].formatted_address;
  } else {
    console.error('No geocode results found.');
  }
}

// Since our function only accepts transformation events,
// we can safely assume the event is of type appevent.transformation
export const handler: FunctionEventHandler<'appevent.transformation'> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  let address;

  // Get the maps API key from the app installation parameters
  const mapsApiKey = context.appInstallationParameters.mapsApiKey;
  if (!mapsApiKey) {
    console.error('No maps API key found in app installation parameters, skipping transformation.');
  } else {
    // If event is an entry, get lat and long fields and geocode them
    if (event.headers['X-Contentful-Topic'].includes('Entry')) {
      event = event as AppEventEntry;
      const lat = event.body.fields.lat['en-US'];
      const long = event.body.fields.long['en-US'];
      if (lat && long) {
        address = await geocode(lat, long, mapsApiKey);
      } else {
        console.error('No lat or long fields found.');
      }
    }
  }

  // Return the original body and headers,
  // the geocoded address if it exists,
  // and a header indicating if the coordinates were geocoded successfully
  return {
    body: {
      ...event.body,
      address,
    },
    headers: {
      ...event.headers,
      'X-Is-Geocoded': address ? 'true' : 'false',
    },
  };
};
