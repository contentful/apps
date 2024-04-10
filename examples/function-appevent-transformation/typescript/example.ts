import { FunctionEventHandler as EventHandler } from '@contentful/node-apps-toolkit';
import https from 'https';

const appEventTransformationingHandler: EventHandler<'appevent.transformation'> = (
  event,
  context
) => {
  // If event is an entry, get lat and long fields and geocode them
  if (event.entityType === 'Entry') {
    const lat = event.entityProps.fields.lat;
    const long = event.entityProps.fields.long;
    if (lat && long) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=YOUR_API_KEY`;

      https
        .get(url, (response) => {
          let data = '';

          response.on('data', (chunk) => {
            data += chunk;
          });

          response.on('end', () => {
            const result = JSON.parse(data);
            console.log(result);

            if (result.results.length > 0) {
              const address = result.results[0].formatted_address;
              console.log(`Geocoded address: ${address}`);
            } else {
              console.log('No results found.');
            }
          });
        })
        .on('error', (error) => {
          console.error('Error:', error.message);
        });
    }
  } else {
    // If event is not an entry, throw an error
    throw new Error('Event is not an Entry');
  }
};

export const handler: EventHandler = (event, context) => {
  if (event.type === 'appevent.transformation') {
    return appEventTransformationingHandler(event, context);
  }
  throw new Error('Unknown Event');
};
