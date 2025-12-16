#!/usr/bin/env node

/*
 * This script deletes all entries from a specific content type
 * It uses the Content Management API to find and delete all entries of the specified content type
 */

import 'dotenv/config';
import {
  askForContentTypeName,
  confirmDeletion,
  createContentfulClient,
  createReadlineInterface,
  getContentTypeIdByName,
  getEntriesByContentType,
  validateEnvironment,
} from './utils';
import { PlainClientAPI } from 'contentful-management';
import { Interface } from 'readline';

export async function deleteEntry(entryId: string, client: PlainClientAPI): Promise<boolean> {
  try {
    try {
      const entry = await client.entry.get({ entryId });
      if (entry.sys.publishedVersion) {
        await client.entry.unpublish({ entryId });
        console.log(`   📤 Unpublished entry: ${entryId}`);
      }
    } catch {
      console.log(`   📤 Entry ${entryId} is not published`);
    }

    await client.entry.delete({ entryId });
    console.log(`   ✅ Deleted entry: ${entryId}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to delete entry ${entryId}:`, error);
    return false;
  }
}

export async function deleteAllEntriesForContentType(
  contentTypeId: string,
  client: PlainClientAPI,
  rl: Interface,
  deleteContentTypeName: string | undefined
): Promise<void> {
  console.log(`\n🔍 Fetching all entries for content type: ${contentTypeId}`);

  const entries = await getEntriesByContentType(client, contentTypeId);

  if (entries.length === 0) {
    console.log('✅ No entries found for this content type.');
    return;
  }

  console.log(`📊 Found ${entries.length} entries to delete.`);

  let confirmed: boolean;
  if (deleteContentTypeName) {
    confirmed = true;
  } else {
    confirmed = await confirmDeletion(rl, entries.length);
  }

  if (!confirmed) {
    console.log('❌ Operation cancelled by user.');
    return;
  }

  console.log('\n🗑️  Starting deletion process...');

  let successCount = 0;
  let failureCount = 0;

  const batchSize = 10;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);

    console.log(
      `\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        entries.length / batchSize
      )}`
    );

    const batchPromises = batch.map(async (entry) => {
      return await deleteEntry(entry.sys.id, client);
    });

    const results = await Promise.all(batchPromises);

    successCount += results.filter(Boolean).length;
    failureCount += results.filter((r) => !r).length;

    if (i + batchSize < entries.length) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log('\n📋 Deletion Summary:');
  console.log(`   ✅ Successfully deleted: ${successCount} entries`);
  console.log(`   ❌ Failed to delete: ${failureCount} entries`);
  console.log(`   📊 Total processed: ${entries.length} entries`);
}

export async function deleteEntries() {
  validateEnvironment();
  const client = createContentfulClient();
  const rl = createReadlineInterface();
  const { DELETE_CONTENT_TYPE_NAME } = process.env;

  try {
    console.log('🗑️  Contentful Entry Deletion Script\n');

    const contentTypeName = await askForContentTypeName(rl, DELETE_CONTENT_TYPE_NAME);

    if (!contentTypeName) {
      console.log('❌ Content type name cannot be empty.');
      return;
    }

    console.log(`\n🔍 Looking for content type: "${contentTypeName}"`);

    const contentTypeId = await getContentTypeIdByName(client, contentTypeName);

    if (!contentTypeId) {
      console.log('\n❌ Content type not found. Please check the name and try again.');
      return;
    }

    console.log(`✅ Found content type: ${contentTypeName} (ID: ${contentTypeId})`);

    await deleteAllEntriesForContentType(contentTypeId, client, rl, DELETE_CONTENT_TYPE_NAME);

    console.log('\n🎉 Script completed successfully!');
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    throw error;
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  deleteEntries();
}
