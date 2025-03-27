import {
  AppEventRequest,
  EntryPublishEventPayload,
  FunctionEventContext,
  FunctionEventHandler,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit';

// Use the Nominatim API to get an address from geocode coordinates
// https://nominatim.org/release-docs/develop/api/Reverse/
const geocodeApi = 'https://nominatim.openstreetmap.org/reverse';

async function geocode(lat: number, long: number) {
  const url = `${geocodeApi}?lat=${lat}&lon=${long}&format=json`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Contentful-App-Event-Transformation/1.0',
      },
    });
    console.log('Geocode response status:', response.status);
    const result = await response.json();
    console.log('Geocode response:', result);
    return result.display_name;
  } catch (error) {
    console.error('Failed to get geocode result', error);
  }
}

// Since our function only accepts transformation events,
// we can safely assume the event is of type appevent.transformation
export const handler: FunctionEventHandler<FunctionTypeEnum.AppEventTransformation> = async (
  event: AppEventRequest,
  context: FunctionEventContext
) => {
  let address;

  // If event is an entry, get lat and long fields and geocode them
  if (event.headers['X-Contentful-Topic'].includes('Entry')) {
    // Since our app event subscription only reacts to Entry publish events,
    // we can safely assume that the event body is EntryPublishEventPayload
    const { body } = event as { body: EntryPublishEventPayload };

    const lat = body.fields.latitude['en-US'];
    const long = body.fields.longitude['en-US'];
    if (lat && long) {
      address = await geocode(Number(lat), Number(long));
    } else {
      console.error('No lat or long fields found.');
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
