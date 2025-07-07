#!/usr/bin/env node

/*
 * This script generates a single content type with a self-referencing field
 * that can create nested references up to 10 levels deep
 * It uses the Content Management API to create a content type that references itself.
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

const MAX_NESTING_LEVEL = 10;

interface EntryInfo {
  id: string;
  level: number;
  title: string;
  referencedEntryId?: string;
}

async function createSelfReferencingContentType(): Promise<string> {
  const contentTypeId = 'nested-self-referencing';
  const contentTypeName = 'Nested Self Referencing';

  console.log(`Creating content type: ${contentTypeName}`);

  const fields: ContentFields[] = [
    {
      id: 'title',
      name: 'Title',
      type: 'Symbol',
      required: true,
      localized: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: 'description',
      name: 'Description',
      type: 'Text',
      required: false,
      localized: false,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: 'level',
      name: 'Nesting Level',
      type: 'Integer',
      required: true,
      localized: false,
      validations: [
        {
          range: {
            min: 1,
            max: MAX_NESTING_LEVEL,
          },
        },
      ],
      disabled: false,
      omitted: false,
    },
    {
      id: 'nestedReference',
      name: 'Nested Reference',
      type: 'Link',
      linkType: 'Entry',
      required: false,
      localized: false,
      validations: [], // Remove validation initially, we'll add it after creation
      disabled: false,
      omitted: false,
    },
  ];

  const body: Omit<ContentTypeProps, 'sys'> = {
    name: contentTypeName,
    displayField: 'title',
    description: `Content type with self-referencing field for testing nested references up to ${MAX_NESTING_LEVEL} levels deep`,
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

async function addSelfReferenceValidation(contentTypeId: string): Promise<void> {
  console.log(`Adding self-reference validation to content type: ${contentTypeId}`);

  try {
    const contentType = await client.contentType.get({ contentTypeId });

    // Find the nestedReference field and add validation
    const updatedFields = contentType.fields.map((field) => {
      if (field.id === 'nestedReference') {
        return {
          ...field,
          validations: [
            {
              linkContentType: [contentTypeId],
            },
          ],
        };
      }
      return field;
    });

    const updatedContentType = await client.contentType.update(
      { contentTypeId },
      {
        ...contentType,
        fields: updatedFields,
      }
    );

    await client.contentType.publish({ contentTypeId }, updatedContentType);
    console.log(`✅ Added self-reference validation to content type: ${contentTypeId}`);
  } catch (err) {
    console.error(
      `❌ Failed to add self-reference validation: ${err instanceof Error ? err.message : err}`
    );
    throw err;
  }
}

async function createNestedEntry(
  contentTypeId: string,
  level: number,
  referencedEntryId?: string
): Promise<EntryInfo> {
  const referenceInfo =
    level === MAX_NESTING_LEVEL
      ? ' (deepest level - no references)'
      : ` (references level ${level + 1})`;

  console.log(`Creating entry for level ${level}${referenceInfo}`);

  const fields: KeyValueMap = {
    title: { 'en-US': `Nested Entry Level ${level}` },
    level: { 'en-US': level },
    description: {
      'en-US': `This is a nested entry at level ${level}. ${
        level === MAX_NESTING_LEVEL
          ? 'This is the deepest level with no further references.'
          : `It references an entry at level ${level + 1}.`
      }`,
    },
  };

  // Add reference field if this is not the deepest level
  if (level < MAX_NESTING_LEVEL && referencedEntryId) {
    fields.nestedReference = {
      'en-US': {
        sys: {
          type: 'Link',
          linkType: 'Entry',
          id: referencedEntryId,
        },
      },
    };
  }

  const body: { fields: KeyValueMap } = { fields };

  try {
    const entryResult = await client.entry.create({ contentTypeId }, body);
    console.log(`✅ Created entry: ${entryResult.sys.id} for level ${level}`);

    // Publish the entry
    await client.entry.publish({ entryId: entryResult.sys.id }, entryResult);
    console.log(`✅ Published entry for level ${level}`);

    return {
      id: entryResult.sys.id,
      level,
      title: `Nested Entry Level ${level}`,
      referencedEntryId,
    };
  } catch (err) {
    console.error(
      `❌ Entry creation failed for level ${level}: ${err instanceof Error ? err.message : err}`
    );
    throw err;
  }
}

async function createNestedEntriesChain(contentTypeId: string): Promise<EntryInfo[]> {
  const entries: EntryInfo[] = [];

  console.log(
    `\n📝 Creating ${MAX_NESTING_LEVEL} entries in reverse order (deepest to shallowest)...`
  );

  // Create entries from deepest level to top level
  // This ensures we have the referenced entry available when creating the reference
  for (let level = MAX_NESTING_LEVEL; level >= 1; level--) {
    // For each level, reference the entry that was just created (the next deeper level)
    const referencedEntryId =
      level < MAX_NESTING_LEVEL
        ? entries[0].id // Use the first entry in the array (most recently created)
        : undefined;

    const entryInfo = await createNestedEntry(contentTypeId, level, referencedEntryId);
    entries.unshift(entryInfo); // Add to beginning to maintain order
  }

  console.log(`\n✅ Successfully created all ${entries.length} entries`);
  return entries;
}

async function main() {
  try {
    console.log('🚀 Starting self-referencing nested content type generation...\n');
    console.log(
      `📋 Creating 1 content type with self-referencing field for ${MAX_NESTING_LEVEL} levels\n`
    );

    // Create the single content type
    const contentTypeId = await createSelfReferencingContentType();

    // Add self-reference validation after content type is created
    await addSelfReferenceValidation(contentTypeId);

    // Create the chain of entries
    const entries = await createNestedEntriesChain(contentTypeId);

    console.log('\n🎉 Success! Self-referencing nested content type generation complete.');
    console.log(`\n📋 Summary:`);
    console.log(`   • Content Type ID: ${contentTypeId}`);
    console.log(`   • Content Type Name: Nested Self Referencing`);
    console.log(`   • Maximum Nesting Level: ${MAX_NESTING_LEVEL}`);
    console.log(`   • Total Entries Created: ${entries.length}`);
    console.log(`   • Self-Reference Depth: ${MAX_NESTING_LEVEL} levels deep`);

    console.log(`\n🔗 Entry Chain (Top to Bottom):`);
    entries.forEach((entry, index) => {
      const referenceInfo =
        index < entries.length - 1
          ? ` → references entry ${entries[index + 1].id} (Level ${entries[index + 1].level})`
          : ' (deepest level - no references)';
      console.log(`   ${index + 1}. Entry ${entry.id} (Level ${entry.level})${referenceInfo}`);
    });

    console.log(`\n📝 Content Type Fields:`);
    console.log(`   • title (Symbol, required) - Entry title`);
    console.log(`   • description (Text) - Entry description`);
    console.log(`   • level (Integer, 1-${MAX_NESTING_LEVEL}) - Nesting level`);
    console.log(`   • nestedReference (Link to Entry) - Self-referencing field`);

    console.log(`\n🔗 Usage Instructions:`);
    console.log(`   • Visit your Contentful space to see the new content type and entries`);
    console.log(
      `   • The top-level entry (${entries[0].id}) contains the full chain of nested references`
    );
    console.log(`   • Each entry references another entry of the same content type`);
    console.log(`   • This creates a ${MAX_NESTING_LEVEL}-level deep self-referential structure`);
    console.log(`   • Perfect for testing how your app handles maximum nested reference depth`);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    throw error;
  }
}

// Run the script
main();
