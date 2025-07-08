#!/usr/bin/env node

/*
 * This script generates a content type with all possible field types for the Iterable app.
 * It uses the Content Management API to create a comprehensive content type that can be used
 * for testing and demonstration purposes.
 */

import * as contentful from 'contentful-management';
import 'dotenv/config';

const { ORG_ID, SPACE_ID, ENVIRONMENT_ID, CMA_TOKEN } = process.env;

if (!CMA_TOKEN || !SPACE_ID || !ENVIRONMENT_ID) {
  console.error(
    'Missing required environment variables. Please set CMA_TOKEN, SPACE_ID, and ENVIRONMENT_ID'
  );
  process.exit(1);
}

const client = contentful.createClient(
  {
    accessToken: CMA_TOKEN,
  },
  {
    type: 'plain',
    defaults: {
      spaceId: SPACE_ID,
      environmentId: ENVIRONMENT_ID,
    },
  }
);

// All possible Contentful field types
const FIELD_TYPES = [
  {
    type: 'Symbol',
    name: 'Short Text',
    id: 'shortText',
    description: 'A short text field (single line)',
  },
  {
    type: 'Text',
    name: 'Long Text',
    id: 'longText',
    description: 'A long text field (multi-line)',
  },
  {
    type: 'RichText',
    name: 'Rich Text',
    id: 'richText',
    description: 'A rich text field with formatting',
  },
  {
    type: 'Integer',
    name: 'Integer Number',
    id: 'integerNumber',
    description: 'A whole number field',
  },
  {
    type: 'Number',
    name: 'Decimal Number',
    id: 'decimalNumber',
    description: 'A decimal number field',
  },
  { type: 'Date', name: 'Date and Time', id: 'dateTime', description: 'A date and time field' },
  { type: 'Boolean', name: 'Boolean', id: 'boolean', description: 'A true/false field' },
  { type: 'Object', name: 'JSON Object', id: 'jsonObject', description: 'A JSON object field' },
  {
    type: 'Location',
    name: 'Location',
    id: 'location',
    description: 'A geographic location field',
  },
  {
    type: 'Link',
    name: 'Asset Link',
    id: 'assetLink',
    linkType: 'Asset',
    description: 'A link to an asset',
  },
  {
    type: 'Link',
    name: 'Entry Link',
    id: 'entryLink',
    linkType: 'Entry',
    description: 'A link to an entry',
  },
  {
    type: 'Array',
    name: 'Symbol Array',
    id: 'symbolArray',
    items: { type: 'Symbol' },
    description: 'An array of short text values',
  },
  {
    type: 'Array',
    name: 'Text Array',
    id: 'textArray',
    items: { type: 'Text' },
    description: 'An array of long text values',
  },
  {
    type: 'Array',
    name: 'Integer Array',
    id: 'integerArray',
    items: { type: 'Integer' },
    description: 'An array of integer values',
  },
  {
    type: 'Array',
    name: 'Number Array',
    id: 'numberArray',
    items: { type: 'Number' },
    description: 'An array of decimal values',
  },
  {
    type: 'Array',
    name: 'Boolean Array',
    id: 'booleanArray',
    items: { type: 'Boolean' },
    description: 'An array of boolean values',
  },
  {
    type: 'Array',
    name: 'Date Array',
    id: 'dateArray',
    items: { type: 'Date' },
    description: 'An array of date values',
  },
  {
    type: 'Array',
    name: 'Location Array',
    id: 'locationArray',
    items: { type: 'Location' },
    description: 'An array of location values',
  },
  {
    type: 'Array',
    name: 'Asset Array',
    id: 'assetArray',
    items: { type: 'Link', linkType: 'Asset' },
    description: 'An array of asset links',
  },
  {
    type: 'Array',
    name: 'Entry Array',
    id: 'entryArray',
    items: { type: 'Link', linkType: 'Entry' },
    description: 'An array of entry links',
  },
  {
    type: 'Array',
    name: 'Object Array',
    id: 'objectArray',
    items: { type: 'Object' },
    description: 'An array of JSON objects',
  },
];

async function createContentTypeWithAllFields() {
  const contentTypeId = 'iterable-all-field-types';
  const contentTypeName = 'Iterable - All Field Types';

  console.log(`Creating content type: ${contentTypeName}`);

  const fields = FIELD_TYPES.map((fieldType) => {
    const baseField = {
      id: fieldType.id,
      name: fieldType.name,
      required: false,
      localized: false,
      validations: [],
      disabled: false,
      omitted: false,
    };

    if (fieldType.type === 'Link') {
      return {
        ...baseField,
        type: 'Link',
        linkType: fieldType.linkType,
      };
    } else if (fieldType.type === 'Array') {
      return {
        ...baseField,
        type: 'Array',
        items: fieldType.items,
      };
    } else {
      return {
        ...baseField,
        type: fieldType.type,
      };
    }
  });

  const body = {
    name: contentTypeName,
    displayField: 'shortText',
    description:
      'A comprehensive content type with all possible field types for testing the Iterable app integration',
    fields,
  };

  try {
    // Check if content type already exists
    try {
      const existingContentType = await client.contentType.get({ contentTypeId });
      console.log(`Content type ${contentTypeId} already exists. Updating...`);

      // Update existing content type
      const updatedContentType = await client.contentType.update(
        { contentTypeId },
        {
          ...existingContentType,
          ...body,
        }
      );

      // Publish the updated content type
      await client.contentType.publish({ contentTypeId }, updatedContentType);

      console.log(`✅ Updated and published content type: ${contentTypeId}`);
      return contentTypeId;
    } catch (error) {
      // Content type doesn't exist, create new one
      const contentTypeProps = await client.contentType.create({}, body);
      console.log(`Created content type: ${contentTypeProps.sys.id}`);

      // Publish the content type
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

  const fields: any = {
    shortText: { 'en-US': 'Sample Short Text' },
    longText: {
      'en-US':
        'This is a sample long text field with multiple lines.\nIt can contain paragraphs and formatting.',
    },
    richText: {
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
                value: 'This is a sample rich text field with formatting.',
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
    },
    integerNumber: { 'en-US': 42 },
    decimalNumber: { 'en-US': 3.14159 },
    dateTime: { 'en-US': '2024-01-15T10:30:00.000Z' },
    boolean: { 'en-US': true },
    jsonObject: { 'en-US': { key: 'value', nested: { data: 'example' } } },
    location: { 'en-US': { lat: 40.7128, lon: -74.006 } },
    symbolArray: { 'en-US': ['Item 1', 'Item 2', 'Item 3'] },
    textArray: { 'en-US': ['Long text item 1', 'Long text item 2'] },
    integerArray: { 'en-US': [1, 2, 3, 4, 5] },
    numberArray: { 'en-US': [1.1, 2.2, 3.3] },
    booleanArray: { 'en-US': [true, false, true] },
    dateArray: { 'en-US': ['2024-01-01T00:00:00.000Z', '2024-01-02T00:00:00.000Z'] },
    locationArray: {
      'en-US': [
        { lat: 40.7128, lon: -74.006 },
        { lat: 34.0522, lon: -118.2437 },
      ],
    },
    objectArray: {
      'en-US': [
        { name: 'Object 1', value: 100 },
        { name: 'Object 2', value: 200 },
      ],
    },
  };

  const body = {
    fields,
  };

  try {
    const entryResult = await client.entry.create({ contentTypeId }, body);
    console.log(`✅ Created sample entry: ${entryResult.sys.id}`);

    // Publish the entry
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
    console.log('🚀 Starting content type generation for Iterable app...\n');

    // Create content type with all field types
    const contentTypeId = await createContentTypeWithAllFields();

    // Create a sample entry
    await createSampleEntry(contentTypeId);

    console.log('\n🎉 Success! Content type generation complete.');
    console.log(`\n📋 Summary:`);
    console.log(`   • Content Type ID: ${contentTypeId}`);
    console.log(`   • Total Fields: ${FIELD_TYPES.length}`);
    console.log(`   • Field Types: ${FIELD_TYPES.map((f) => f.type).join(', ')}`);
    console.log(`\n🔗 You can now use this content type to test the Iterable app integration.`);
    console.log(`   Visit your Contentful space to see the new content type and sample entry.`);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
