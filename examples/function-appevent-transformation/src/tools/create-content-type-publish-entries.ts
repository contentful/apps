import { client, spaceId, environmentId } from './contentful-client-and-imports';

const createContentTypeAndPublishEntry = async () => {
  const contentTypeId = 'geocodeLocation';
  try {
    const contentType = await client.contentType.createWithId(
      {
        spaceId,
        environmentId,
        contentTypeId,
      },
      {
        name: 'Geocode Location',
        fields: [
          {
            id: 'title',
            name: 'Title',
            type: 'Symbol',
            required: false,
            localized: false,
          },
          {
            id: 'latitude',
            name: 'Latitude',
            type: 'Symbol',
            required: false,
            localized: false,
          },
          {
            id: 'longitude',
            name: 'Longitude',
            type: 'Symbol',
            required: false,
            localized: false,
          },
        ],
        displayField: 'title',
      }
    );

    await client.contentType.publish(
      {
        spaceId,
        environmentId,
        contentTypeId,
      },
      contentType
    );

    console.log('Content type created and activated');
    console.dir(contentType, { depth: 5 });

    const testEntry = await client.entry.create(
      {
        spaceId,
        environmentId,
        contentTypeId,
      },
      {
        fields: {
          title: {
            'en-US': 'Test entry',
          },
          latitude: {
            'en-US': '52.53969',
          },
          longitude: {
            'en-US': '13.38449',
          },
        },
      }
    );

    console.log('Entry created');
    console.dir(testEntry, { depth: 5 });

    // Publish both entries
    const publishedTestEntry = await client.entry.publish(
      {
        spaceId,
        environmentId,
        entryId: testEntry.sys.id,
      },
      { ...testEntry }
    );

    console.log('Entry published');
    console.dir(publishedTestEntry, { depth: 5 });
  } catch (error) {
    console.error(error);
  }
};

createContentTypeAndPublishEntry();
