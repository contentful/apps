import { client, spaceId, environmentId } from './contentful-client-and-imports';

const createContentTypeAndPublishEntry = async () => {
  const contentTypeId = 'sentimentAnalysis';
  try {
    const contentType = await client.contentType.createWithId(
      {
        spaceId,
        environmentId,
        contentTypeId,
      },
      {
        name: 'Sentiment Analysis',
        fields: [
          {
            id: 'title',
            name: 'Title',
            type: 'Symbol',
            required: false,
            localized: false,
          },
          {
            id: 'description',
            name: 'Description',
            type: 'Text',
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

    const positiveEntry = await client.entry.create(
      {
        spaceId,
        environmentId,
        contentTypeId,
      },
      {
        fields: {
          title: {
            'en-US': 'Positive entry',
          },
          description: {
            'en-US': 'This is a positive entry!',
          },
        },
      }
    );

    const negativeEntry = await client.entry.create(
      {
        spaceId,
        environmentId,
        contentTypeId,
      },
      {
        fields: {
          title: {
            'en-US': 'Negative entry',
          },
          description: {
            'en-US': 'This is a negative entry',
          },
        },
      }
    );

    console.log('Entries created');
    console.dir(positiveEntry, { depth: 5 });
    console.dir(negativeEntry, { depth: 5 });

    // Publish both entries
    const publishedPositiveEntry = await client.entry.publish(
      {
        spaceId,
        environmentId,
        entryId: positiveEntry.sys.id,
      },
      { ...positiveEntry }
    );

    const publishedNegativeEntry = await client.entry.publish(
      {
        spaceId,
        environmentId,
        entryId: negativeEntry.sys.id,
      },
      { ...negativeEntry }
    );

    console.log('Entries published');
    console.dir(publishedPositiveEntry, { depth: 5 });
    console.dir(publishedNegativeEntry, { depth: 5 });
  } catch (error) {
    console.error(error);
  }
};

createContentTypeAndPublishEntry();
