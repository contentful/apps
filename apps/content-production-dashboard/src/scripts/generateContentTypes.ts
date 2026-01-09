#!/usr/bin/env node

import 'dotenv/config';
import {
  validateEnvironment,
  createContentfulClient,
  createReadlineInterface,
  askForContentTypeCount,
} from './utils';
import { PlainClientAPI } from 'contentful-management';

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

export async function createSampleContentType(
  index: number,
  client: PlainClientAPI
): Promise<string> {
  const contentTypeName = `Sample Content Type ${index + 1}`;

  console.log(`Creating content type: ${contentTypeName}`);

  // Create a subset of fields for each content type to make them unique
  // Each content type will have a different combination of fields
  const fieldsToUse = FIELD_TYPES.slice(0, Math.min(5 + (index % 5), FIELD_TYPES.length));

  const fields = fieldsToUse.map((fieldType) => {
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
    description: `Sample content type ${index + 1} for testing the app integration`,
    fields,
  };

  try {
    const contentTypeProps = await client.contentType.create({}, body);
    console.log(`Created content type: ${contentTypeProps.sys.id}`);

    await client.contentType.publish({ contentTypeId: contentTypeProps.sys.id }, contentTypeProps);

    console.log(`✅ Created and published content type: ${contentTypeProps.sys.id}`);
    return contentTypeProps.sys.id;
  } catch (err) {
    console.error(
      `❌ Content type ${index + 1} creation failed: ${err instanceof Error ? err.message : err}`
    );
    throw err;
  }
}

export async function batchContentTypes(
  numberOfContentTypes: number,
  client: PlainClientAPI
): Promise<string[]> {
  console.log(`Creating ${numberOfContentTypes} content types in batches...`);

  const batchSize = 5;
  let successCount = 0;
  let failureCount = 0;
  const createdContentTypeIds: string[] = [];

  for (let i = 0; i < numberOfContentTypes; i += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, numberOfContentTypes - i) },
      (_, batchIndex) => createSampleContentType(i + batchIndex, client)
    );

    console.log(
      `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        numberOfContentTypes / batchSize
      )}`
    );

    try {
      const batchResults = await Promise.all(batch);
      successCount += batchResults.length;
      createdContentTypeIds.push(...batchResults);
      console.log(`✅ Completed batch ${Math.floor(i / batchSize) + 1}`);
    } catch (error) {
      failureCount += batch.length;
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
    }

    if (i + batchSize < numberOfContentTypes) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n📊 Creation Summary:`);
  console.log(`   ✅ Successfully created: ${successCount} content types`);
  console.log(`   ❌ Failed to create: ${failureCount} content types`);
  console.log(`   📊 Total processed: ${numberOfContentTypes} content types`);

  console.log('\n🎉 Success! Content type generation complete.');
  console.log(`\n📋 Summary:`);
  console.log(`   • Total Content Types Created: ${successCount}`);
  console.log(`   • Content Type IDs: ${createdContentTypeIds.join(', ')}`);
  console.log(`\n🔗 You can now use these content types to test the app integration.`);
  console.log(`   Visit your Contentful space to see the new content types.`);

  return createdContentTypeIds;
}

export async function generateContentTypes() {
  validateEnvironment();
  const client = createContentfulClient();
  const rl = createReadlineInterface();
  const { AMOUNT_OF_CONTENT_TYPES } = process.env;

  if (!AMOUNT_OF_CONTENT_TYPES) {
    try {
      const numberOfContentTypes = await askForContentTypeCount(rl);
      await batchContentTypes(numberOfContentTypes, client);
    } catch (error) {
      console.error('❌ Script failed:', error);
      throw error;
    } finally {
      rl.close();
    }
  } else {
    const numberOfContentTypes = parseInt(AMOUNT_OF_CONTENT_TYPES);

    if (isNaN(numberOfContentTypes) || numberOfContentTypes <= 0) {
      console.error('❌ AMOUNT_OF_CONTENT_TYPES must be a valid positive number');
      throw new Error('Invalid content type count');
    }

    await batchContentTypes(numberOfContentTypes, client);
  }
}

if (require.main === module) {
  generateContentTypes();
}
