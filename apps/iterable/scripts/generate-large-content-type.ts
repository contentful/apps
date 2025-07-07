#!/usr/bin/env node

/*
 * This script generates a content type with 100 short text fields and 1 rich text field
 * It uses the Content Management API to create a large content type for performance and edge case testing.
 */

import * as contentful from 'contentful-management';
import type {
  ContentFields,
  ContentTypeProps,
  EntryProps,
  KeyValueMap,
} from 'contentful-management';
import 'dotenv/config';

const { SPACE_ID, ENVIRONMENT_ID, CONTENTFUL_ACCESS_TOKEN } = process.env;

if (!CONTENTFUL_ACCESS_TOKEN || !SPACE_ID || !ENVIRONMENT_ID) {
  console.error(
    'Missing required environment variables. Please set CONTENTFUL_ACCESS_TOKEN, SPACE_ID, and ENVIRONMENT_ID'
  );
  throw new Error('Missing required environment variables');
}

const client = contentful.createClient(
  {
    accessToken: CONTENTFUL_ACCESS_TOKEN,
  },
  {
    type: 'plain',
    defaults: {
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
    },
  }
);

function generateFields(): ContentFields[] {
  const fields: ContentFields[] = [];
  for (let i = 1; i <= 49; i++) {
    fields.push({
      id: `shortText${i}`,
      name: `Short Text ${i}`,
      type: 'Symbol',
      required: false,
      localized: false,
      validations: [],
      disabled: false,
      omitted: false,
    });
  }
  fields.push({
    id: 'richText',
    name: 'Rich Text',
    type: 'RichText',
    required: false,
    localized: false,
    validations: [],
    disabled: false,
    omitted: false,
  });
  return fields;
}

async function createLargeContentType() {
  const contentTypeId = 'large-content-type';
  const contentTypeName = 'Large Content Type';

  console.log(`Creating content type: ${contentTypeName}`);

  const fields = generateFields();

  // ContentTypeProps requires all fields to be present
  const body: Omit<ContentTypeProps, 'sys'> = {
    name: contentTypeName,
    displayField: 'shortText1',
    description: 'A content type with 50 short text fields and 1 rich text field for testing',
    fields,
  };

  try {
    // Check if content type already exists
    try {
      const existingContentType = await client.contentType.get({ contentTypeId });
      console.log(`Content type ${contentTypeId} already exists. Updating...`);
      const updatedContentType = await client.contentType.update(
        { contentTypeId },
        {
          ...existingContentType,
          ...body,
        }
      );
      await client.contentType.publish({ contentTypeId }, updatedContentType);
      console.log(`✅ Updated and published content type: ${contentTypeId}`);
      return contentTypeId;
    } catch (error) {
      // Content type doesn't exist, create new one
      const contentTypeProps = await client.contentType.create({}, body);
      console.log(`Created content type: ${contentTypeProps.sys.id}`);
      await client.contentType.publish(
        { contentTypeId: contentTypeProps.sys.id },
        contentTypeProps
      );
      console.log(`✅ Created and published content type: ${contentTypeProps.sys.id}`);
      return contentTypeProps.sys.id;
    }
  } catch (err) {
    console.error(`❌ Content type creation failed: ${err instanceof Error ? err.message : err}`);
    throw err;
  }
}

async function createSampleEntry(contentTypeId: string) {
  console.log('Creating sample entry...');
  const fields: KeyValueMap = {};
  for (let i = 1; i <= 49; i++) {
    fields[`shortText${i}`] = { 'en-US': `Sample text ${i}` };
  }
  fields['richText'] = {
    'en-US': {
      nodeType: 'document',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value: 'This is a sample rich text field.',
              marks: [],
              data: {},
            },
          ],
        },
      ],
    },
  };
  const body: { fields: KeyValueMap } = { fields };
  try {
    const entryResult = await client.entry.create({ contentTypeId }, body);
    console.log(`✅ Created sample entry: ${entryResult.sys.id}`);
    await client.entry.publish({ entryId: entryResult.sys.id }, entryResult);
    console.log(`✅ Published sample entry`);
    return entryResult.sys.id;
  } catch (err) {
    console.error(`❌ Entry creation failed: ${err instanceof Error ? err.message : err}`);
    throw err;
  }
}

async function main() {
  try {
    console.log('🚀 Starting large content type generation for app...\n');
    const contentTypeId = await createLargeContentType();
    await createSampleEntry(contentTypeId);
    console.log('🎉 Done!');
  } catch (err) {
    process.exit(1);
  }
}

main();
