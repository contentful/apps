import { client, spaceId, environmentId, contentTypeId } from './contentful-client-and-imports';

const createContentTypeAndPublishEntry = async () => {
  let contentTypeIdForEntry = contentTypeId;
  if (!contentTypeId) {
    // If no content type ID is provided, create a new one
    const newContentTypeId = 'appEventHandlerFunction';
    try {
      const contentType = await client.contentType.createWithId(
        {
          spaceId,
          environmentId,
          contentTypeId: newContentTypeId,
        },
        {
          name: 'App Event Handler Function',
          fields: [
            {
              id: 'title',
              name: 'Title',
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
          contentTypeId: newContentTypeId,
        },
        contentType
      );

      console.log('Content type created and activated');
      console.dir(contentType, { depth: 5 });
      contentTypeIdForEntry = newContentTypeId;
    } catch (error) {
      console.error(error);
    }
  }

  try {
    // Create an entry
    const testEntry = await client.entry.create(
      {
        spaceId,
        environmentId,
        contentTypeId: contentTypeIdForEntry,
      },
      {
        fields: {
          title: {
            'en-US': 'Test entry',
          },
        },
      }
    );

    console.log('Entry created');
    console.dir(testEntry, { depth: 5 });

    // Publish the entry
    const publishedEntry = await client.entry.publish(
      {
        spaceId,
        environmentId,
        entryId: testEntry.sys.id,
      },
      { ...testEntry }
    );

    console.log('Entry published');
    console.dir(publishedEntry, { depth: 5 });
  } catch (error) {
    console.error(error);
  }
};

createContentTypeAndPublishEntry();
