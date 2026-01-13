#!/usr/bin/env node

import 'dotenv/config';
import {
  validateEnvironment,
  createContentfulClient,
  createReadlineInterface,
  askForContentTypeCount,
  askForEntryCount,
} from './utils';
import { KeyValueMap, PlainClientAPI } from 'contentful-management';

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

// Unique content type names
const CONTENT_TYPE_NAMES = [
  'Article',
  'Blog Post',
  'Product',
  'Event',
  'News',
  'Page',
  'Author',
  'Category',
  'Tag',
  'Review',
  'Testimonial',
  'FAQ',
  'Gallery',
  'Video',
  'Podcast',
  'Course',
  'Lesson',
  'Recipe',
  'Restaurant',
  'Hotel',
  'Destination',
  'Team Member',
  'Project',
  'Portfolio',
  'Case Study',
  'Whitepaper',
  'Ebook',
  'Webinar',
  'Press Release',
  'Announcement',
];

function generateContentTypeName(index: number): string {
  if (index < CONTENT_TYPE_NAMES.length) {
    return CONTENT_TYPE_NAMES[index];
  }
  // If we exceed the predefined names, generate unique names
  return `Content Type ${index + 1}`;
}

function generateContentTypeId(name: string, index: number): string {
  // Convert name to kebab-case and ensure uniqueness
  const baseId = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Add index to ensure uniqueness
  return `${baseId}-${index + 1}`;
}

function generateUniqueContentTypeId(baseId: string, attempt: number = 0): string {
  if (attempt === 0) {
    return baseId;
  }
  // Add timestamp and attempt number to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6);
  return `${baseId}-${timestamp}-${attempt}`;
}

function generateSampleFieldValue(
  fieldType: (typeof FIELD_TYPES)[number],
  entryIndex: number
): any {
  const baseValue = {
    'en-US': null as any,
  };

  switch (fieldType.type) {
    case 'Symbol':
      return { 'en-US': `Sample Text ${entryIndex + 1}` };
    case 'Text':
      return {
        'en-US': `This is a sample long text field for entry ${
          entryIndex + 1
        }.\nIt can contain multiple lines and paragraphs.`,
      };
    case 'RichText':
      return {
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
                  value: `Sample rich text content for entry ${entryIndex + 1}.`,
                  marks: [],
                  data: {},
                },
              ],
            },
          ],
        },
      };
    case 'Integer':
      return { 'en-US': 10 + entryIndex };
    case 'Number':
      return { 'en-US': 3.14 + entryIndex };
    case 'Date':
      return { 'en-US': new Date(2024, 0, 1 + entryIndex).toISOString() };
    case 'Boolean':
      return { 'en-US': entryIndex % 2 === 0 };
    case 'Object':
      return { 'en-US': { key: `value${entryIndex + 1}`, index: entryIndex + 1 } };
    case 'Location':
      return { 'en-US': { lat: 40.7128 + entryIndex * 0.1, lon: -74.006 + entryIndex * 0.1 } };
    case 'Link':
      // Skip Link fields as they require existing assets/entries
      return null;
    case 'Array':
      if (fieldType.items?.type === 'Symbol') {
        return {
          'en-US': [
            `Item ${entryIndex + 1}-1`,
            `Item ${entryIndex + 1}-2`,
            `Item ${entryIndex + 1}-3`,
          ],
        };
      }
      // Skip other array types as they require existing assets/entries
      return null;
    default:
      return null;
  }
}

async function createEntriesForContentType(
  contentTypeId: string,
  fieldsToUse: typeof FIELD_TYPES,
  numberOfEntries: number,
  client: PlainClientAPI
): Promise<void> {
  console.log(`Creating ${numberOfEntries} entries for content type ${contentTypeId}...`);

  for (let entryIndex = 0; entryIndex < numberOfEntries; entryIndex++) {
    try {
      const fields: KeyValueMap = {};

      // Generate field values for each field in the content type
      for (const fieldType of fieldsToUse) {
        const fieldValue = generateSampleFieldValue(fieldType, entryIndex);
        if (fieldValue !== null) {
          fields[fieldType.id] = fieldValue;
        }
      }

      const body = {
        fields,
      };

      const entryResult = await client.entry.create({ contentTypeId }, body);
      await client.entry.publish({ entryId: entryResult.sys.id }, entryResult);
      console.log(
        `  ✅ Created and published entry ${entryIndex + 1}/${numberOfEntries}: ${
          entryResult.sys.id
        }`
      );
    } catch (err) {
      console.error(
        `  ❌ Entry ${entryIndex + 1} creation failed: ${err instanceof Error ? err.message : err}`
      );
      // Continue with next entry even if one fails
    }
  }
}

export async function createSampleContentType(
  index: number,
  numberOfEntries: number,
  client: PlainClientAPI
): Promise<{ contentTypeId: string; fieldsToUse: typeof FIELD_TYPES }> {
  const contentTypeName = generateContentTypeName(index);
  const baseContentTypeId = generateContentTypeId(contentTypeName, index);

  console.log(`Creating content type: ${contentTypeName} (ID: ${baseContentTypeId})`);

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
    description: `${contentTypeName} content type for testing the app integration`,
    fields,
  };

  let contentTypeId = baseContentTypeId;
  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    try {
      const contentTypeProps = await client.contentType.createWithId({ contentTypeId }, body);
      console.log(`Created content type: ${contentTypeId}`);

      await client.contentType.publish({ contentTypeId }, contentTypeProps);

      console.log(`✅ Created and published content type: ${contentTypeId} (${contentTypeName})`);

      // Create entries for this content type
      await createEntriesForContentType(contentTypeId, fieldsToUse, numberOfEntries, client);

      return { contentTypeId, fieldsToUse };
    } catch (err: any) {
      // Handle VersionMismatch (409) - content type might already exist
      if ((err?.status === 409 || err?.name === 'VersionMismatch') && attempt < maxAttempts - 1) {
        attempt++;
        contentTypeId = generateUniqueContentTypeId(baseContentTypeId, attempt);
        console.log(`⚠️  Content type ID already exists. Trying with new ID: ${contentTypeId}...`);
        continue;
      }

      // If we've exhausted attempts or it's a different error, throw
      console.error(
        `❌ Content type ${contentTypeName} (${contentTypeId}) creation failed: ${
          err instanceof Error ? err.message : err
        }`
      );
      throw err;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error(`Failed to create content type after ${maxAttempts} attempts`);
}

export async function batchContentTypes(
  numberOfContentTypes: number,
  numberOfEntriesPerContentType: number,
  client: PlainClientAPI
): Promise<string[]> {
  console.log(`Creating ${numberOfContentTypes} content types in batches...`);
  console.log(`Each content type will have ${numberOfEntriesPerContentType} entries.`);

  const batchSize = 5;
  let successCount = 0;
  let failureCount = 0;
  const createdContentTypeIds: string[] = [];

  for (let i = 0; i < numberOfContentTypes; i += batchSize) {
    const batch = Array.from(
      { length: Math.min(batchSize, numberOfContentTypes - i) },
      (_, batchIndex) =>
        createSampleContentType(i + batchIndex, numberOfEntriesPerContentType, client)
    );

    console.log(
      `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        numberOfContentTypes / batchSize
      )}`
    );

    try {
      const batchResults = await Promise.all(batch);
      successCount += batchResults.length;
      createdContentTypeIds.push(...batchResults.map((result) => result.contentTypeId));
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

  const totalEntriesCreated = successCount * numberOfEntriesPerContentType;

  console.log(`\n📊 Creation Summary:`);
  console.log(`   ✅ Successfully created: ${successCount} content types`);
  console.log(
    `   ✅ Successfully created: ${totalEntriesCreated} entries (${numberOfEntriesPerContentType} per content type)`
  );
  console.log(`   ❌ Failed to create: ${failureCount} content types`);
  console.log(`   📊 Total processed: ${numberOfContentTypes} content types`);

  console.log('\n🎉 Success! Content type and entry generation complete.');
  console.log(`\n📋 Summary:`);
  console.log(`   • Total Content Types Created: ${successCount}`);
  console.log(`   • Total Entries Created: ${totalEntriesCreated}`);
  console.log(`   • Entries per Content Type: ${numberOfEntriesPerContentType}`);
  console.log(`   • Content Type IDs: ${createdContentTypeIds.join(', ')}`);
  console.log(`\n🔗 You can now use these content types to test the app integration.`);
  console.log(`   Visit your Contentful space to see the new content types and entries.`);

  return createdContentTypeIds;
}

export async function generateContentTypes() {
  validateEnvironment();
  const client = createContentfulClient();
  const rl = createReadlineInterface();
  const { AMOUNT_OF_CONTENT_TYPES, ENTRIES_PER_CONTENT_TYPE } = process.env;

  let numberOfContentTypes: number;
  let numberOfEntriesPerContentType: number;

  if (!AMOUNT_OF_CONTENT_TYPES) {
    try {
      numberOfContentTypes = await askForContentTypeCount(rl);
    } catch (error) {
      console.error('❌ Script failed:', error);
      rl.close();
      throw error;
    }
  } else {
    numberOfContentTypes = parseInt(AMOUNT_OF_CONTENT_TYPES);

    if (isNaN(numberOfContentTypes) || numberOfContentTypes <= 0) {
      console.error('❌ AMOUNT_OF_CONTENT_TYPES must be a valid positive number');
      rl.close();
      throw new Error('Invalid content type count');
    }
  }

  if (!ENTRIES_PER_CONTENT_TYPE) {
    try {
      numberOfEntriesPerContentType = await askForEntryCount(rl);
    } catch (error) {
      console.error('❌ Script failed:', error);
      rl.close();
      throw error;
    }
  } else {
    numberOfEntriesPerContentType = parseInt(ENTRIES_PER_CONTENT_TYPE);

    if (isNaN(numberOfEntriesPerContentType) || numberOfEntriesPerContentType <= 0) {
      console.error('❌ ENTRIES_PER_CONTENT_TYPE must be a valid positive number');
      rl.close();
      throw new Error('Invalid entries per content type count');
    }
  }

  try {
    await batchContentTypes(numberOfContentTypes, numberOfEntriesPerContentType, client);
  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  generateContentTypes();
}
