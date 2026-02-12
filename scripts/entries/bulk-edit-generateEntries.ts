#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validateEnvironment,
  createContentfulClient,
  createReadlineInterface,
  askForEntryCount,
} from './utils.ts';
import type { KeyValueMap, PlainClientAPI } from 'contentful-management';

// Load environment variables from .env file in scripts directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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
    name: 'Asset',
    id: 'asset',
    linkType: 'Asset',
    description: 'A link to an asset',
  },
  {
    type: 'Link',
    name: 'Reference',
    id: 'reference',
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
];

export async function createContentTypeWithAllFields(client: PlainClientAPI) {
  const contentTypeName = 'All Field Types';

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
      'A comprehensive content type with all possible field types for testing the app integration',
    fields,
  };

  try {
    const contentTypeProps = await client.contentType.create({}, body);
    console.log(`Created content type: ${contentTypeProps.sys.id}`);

    await client.contentType.publish({ contentTypeId: contentTypeProps.sys.id }, contentTypeProps);

    console.log(`✅ Created and published content type: ${contentTypeProps.sys.id}`);
    return contentTypeProps.sys.id;
  } catch (err) {
    console.error(`❌ Content type creation failed: ${err instanceof Error ? err.message : err}`);
    throw err;
  }
}

export async function createSampleEntry(
  contentTypeId: string,
  index: number,
  client: PlainClientAPI
) {
  console.log(`Creating sample entry ${index + 1}...`);

  const fields: KeyValueMap = {
    shortText: { 'en-US': 'Sample Short Text ' + (index + 1) },
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
  };

  const body = {
    title: { 'en-US': `Sample Entry ${index + 1}` },
    fields,
  };

  try {
    const entryResult = await client.entry.create({ contentTypeId }, body);
    console.log(`✅ Created sample entry: ${entryResult.sys.id}`);

    await client.entry.publish({ entryId: entryResult.sys.id }, entryResult);
    console.log(`✅ Published sample entry ${index + 1}`);

    return entryResult.sys.id;
  } catch (err) {
    console.error(
      `❌ Entry ${index + 1} creation failed: ${err instanceof Error ? err.message : err}`
    );
    throw err;
  }
}

export async function batchEntries(
  numberOfEntries: number,
  contentTypeId: string,
  client: PlainClientAPI
) {
  console.log(`Creating ${numberOfEntries} entries in batches...`);

  const batchSize = 10;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < numberOfEntries; i += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, numberOfEntries - i) },
      (_, batchIndex) => createSampleEntry(contentTypeId, i + batchIndex, client)
    );

    console.log(
      `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        numberOfEntries / batchSize
      )}`
    );

    try {
      const batchResults = await Promise.all(batch);
      successCount += batchResults.length;
      console.log(`✅ Completed batch ${Math.floor(i / batchSize) + 1}`);
    } catch (error) {
      failureCount += batch.length;
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
    }

    if (i + batchSize < numberOfEntries) {
      console.log('⏳ Waiting 1 second before next batch...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n📊 Creation Summary:`);
  console.log(`   ✅ Successfully created: ${successCount} entries`);
  console.log(`   ❌ Failed to create: ${failureCount} entries`);
  console.log(`   📊 Total processed: ${numberOfEntries} entries`);

  console.log('\n🎉 Success! Content type generation complete.');
  console.log(`\n📋 Summary:`);
  console.log(`   • Content Type ID: ${contentTypeId}`);
  console.log(`   • Total Fields: ${FIELD_TYPES.length}`);
  console.log(`   • Field Types: ${FIELD_TYPES.map((f) => f.type).join(', ')}`);
  console.log(`\n🔗 You can now use this content type to test the app integration.`);
  console.log(`   Visit your Contentful space to see the new content type and sample entry.`);
}

export async function generateEntries() {
  validateEnvironment();
  const client = createContentfulClient();
  const rl = createReadlineInterface();
  const { AMOUNT_OF_ENTRIES } = process.env;

  const contentTypeId = await createContentTypeWithAllFields(client);

  if (!AMOUNT_OF_ENTRIES) {
    try {
      const numberOfEntries = await askForEntryCount(rl);
      await batchEntries(numberOfEntries, contentTypeId, client);
    } catch (error) {
      console.error('❌ Script failed:', error);
      throw error;
    } finally {
      rl.close();
    }
  } else {
    const numberOfEntries = parseInt(AMOUNT_OF_ENTRIES);

    await batchEntries(numberOfEntries, contentTypeId, client);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateEntries();
}
