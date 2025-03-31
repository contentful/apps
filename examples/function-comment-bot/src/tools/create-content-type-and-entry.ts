import { client, spaceId, environmentId, contentTypeId } from './contentful-client-and-imports';
import * as fs from 'fs';
import * as path from 'path';

const createContentTypeAndEntry = async () => {
  let contentTypeIdForEntry = contentTypeId;
  if (!contentTypeId) {
    // If no content type ID is provided, create a new one
    const newContentTypeId = 'commentBotTest';
    try {
      const contentType = await client.contentType.createWithId(
        {
          spaceId,
          environmentId,
          contentTypeId: newContentTypeId,
        },
        {
          name: 'Comment Bot Test',
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

  let testEntryId;
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

    testEntryId = testEntry.sys.id;
    console.log('Entry created');
    console.dir(testEntry, { depth: 5 });
  } catch (error) {
    console.error(error);
  }

  // Save content type and entry IDs as environment variables
  const envFilePath = path.resolve(process.cwd(), '.env');
  const envContent =
    contentTypeId !== contentTypeIdForEntry
      ? `\nCONTENTFUL_CONTENT_TYPE_ID=${contentTypeIdForEntry}\nCONTENTFUL_ENTRY_ID=${testEntryId}\n`
      : `CONTENTFUL_ENTRY_ID=${testEntryId}`;

  try {
    fs.writeFileSync(envFilePath, envContent, { flag: 'a' });
    console.log(`Environment variables saved to ${envFilePath}`);
  } catch (error) {
    console.error('Failed to save environment variables', error);
  }
};

createContentTypeAndEntry();
