/**
 * Test script for verifying sync functionality
 */

import { SyncContent } from './services/klaviyo-sync-service';

// Mock logger to capture logs
const logs = [];
const mockLogger = {
  log: (...args) => {
    console.log(...args);
    logs.push({ type: 'log', args });
  },
  error: (...args) => {
    console.error(...args);
    logs.push({ type: 'error', args });
  },
  warn: (...args) => {
    console.warn(...args);
    logs.push({ type: 'warn', args });
  },
};

// Replace the real logger with our mock
jest.mock('./utils/logger', () => mockLogger);

// Mock SDK
const mockSdk = {
  ids: {
    entry: 'test-entry-id',
    contentType: 'test-content-type-id',
    environment: 'master',
  },
  entry: {
    fields: {
      title: {
        getValue: () => 'Test Entry Title',
      },
      description: {
        getValue: () => 'Test Entry Description',
      },
    },
    getSys: () => ({
      id: 'test-entry-id',
      contentType: {
        sys: {
          id: 'test-content-type-id',
        },
      },
    }),
  },
};

// Test mappings
const mockMappings = [
  {
    contentfulFieldId: 'title',
    klaviyoBlockName: 'Title',
    fieldType: 'text',
  },
  {
    contentfulFieldId: 'description',
    klaviyoBlockName: 'Description',
    fieldType: 'text',
  },
];

// Test different scenarios
async function runTests() {
  console.log('=== Running Sync Content Tests ===');

  // Test 1: With full SDK
  console.log('\n--- Test 1: With full SDK ---');
  const syncService1 = new SyncContent(null, mockSdk);
  await syncService1.syncContent(mockSdk, mockMappings);

  // Test 2: With options but no SDK ids
  console.log('\n--- Test 2: With options but no SDK ids ---');
  const mockSdkNoIds = { ...mockSdk, ids: undefined };
  const syncService2 = new SyncContent(null);
  await syncService2.syncContent(mockSdkNoIds, mockMappings, {
    entryId: 'option-entry-id',
    contentTypeId: 'option-content-type-id',
  });

  // Test 3: With neither SDK ids nor options
  console.log('\n--- Test 3: With neither SDK ids nor options ---');
  const syncService3 = new SyncContent(null);
  await syncService3.syncContent(
    {
      entry: mockSdk.entry,
    },
    mockMappings
  );

  // Print summary
  console.log('\n=== Test Summary ===');
  const entryIdLogs = logs.filter(
    (log) => log.args[0] && typeof log.args[0] === 'string' && log.args[0].includes('entryId')
  );

  console.log('Entry ID detection logs:');
  entryIdLogs.forEach((log) => {
    console.log(`- ${log.args[0]} ${log.args[1] || ''}`);
  });

  const errorLogs = logs.filter((log) => log.type === 'error');
  console.log(`\nTotal errors: ${errorLogs.length}`);

  if (errorLogs.length > 0) {
    console.log('Error logs:');
    errorLogs.forEach((log) => {
      console.log(`- ${log.args[0]} ${JSON.stringify(log.args[1] || '')}`);
    });
  }
}

// Run the tests
runTests().catch(console.error);
