#!/usr/bin/env node

/*
 * This script deletes all entries from a specific content type
 * It uses the Content Management API to find and delete all entries of the specified content type
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  askForContentTypeId,
  confirmDeletion,
  createContentfulClient,
  createReadlineInterface,
  getEntriesByContentType,
  validateEnvironment,
} from './utils.ts';
import type { PlainClientAPI } from 'contentful-management';
import { Interface } from 'readline';

// Load environment variables from .env file in scripts directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export async function deleteEntry(entryId: string, client: PlainClientAPI): Promise<boolean> {
  try {
    try {
      const entry = await client.entry.get({ entryId });
      if (entry.sys.publishedVersion) {
        await client.entry.unpublish({ entryId });
      }
    } catch {}

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
  deleteContentTypeId: string | undefined
): Promise<void> {
  const entries = await getEntriesByContentType(client, contentTypeId);

  if (entries.length === 0) {
    console.log('✅ No entries found for this content type.');
    return;
  }

  let confirmed: boolean;
  if (deleteContentTypeId) {
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
  const { DELETE_CONTENT_TYPE_ID } = process.env;

  try {
    const contentTypeId = await askForContentTypeId(rl, DELETE_CONTENT_TYPE_ID);

    if (!contentTypeId) {
      console.log('❌ Content type ID cannot be empty.');
      return;
    }

    console.log(`\n🔍 Deleting entries for content type ID: "${contentTypeId}"`);

    await deleteAllEntriesForContentType(contentTypeId, client, rl, DELETE_CONTENT_TYPE_ID);

    console.log('\n🎉 Script completed successfully!');
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    throw error;
  } finally {
    rl.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  deleteEntries();
}
