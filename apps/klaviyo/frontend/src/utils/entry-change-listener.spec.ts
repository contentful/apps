import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  initializeEntryChangeMonitoring,
  checkIfEntryNeedsSync,
  registerPublishListener,
} from './entry-change-listener';
import { SidebarExtensionSDK } from '@contentful/app-sdk';

// Mock dependencies
vi.mock('./sync-api', () => ({
  fetchEntrySyncStatus: vi.fn(),
  markEntryForSyncViaApi: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./logger', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { fetchEntrySyncStatus, markEntryForSyncViaApi } from './sync-api';

describe('entry-change-listener', () => {
  let mockSdk: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock SDK
    mockSdk = {
      entry: {
        getSys: vi.fn().mockReturnValue({ id: 'entry-123', version: 1 }),
        fields: {
          title: {
            onValueChanged: vi.fn().mockReturnValue(() => {}),
          },
          description: {
            onValueChanged: vi.fn().mockReturnValue(() => {}),
          },
        },
        onSysChanged: vi.fn().mockReturnValue(() => {}),
      },
      ids: {
        contentType: 'blog-post',
      },
      contentType: {
        name: 'Blog Post',
      },
      notifier: {
        success: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as Partial<SidebarExtensionSDK>;

    // Reset mocks
    vi.mocked(fetchEntrySyncStatus).mockReset();
    vi.mocked(markEntryForSyncViaApi).mockReset().mockResolvedValue(true);
  });

  describe('initializeEntryChangeMonitoring', () => {
    it('should set up listeners for specified fields', () => {
      const fieldMappings = [{ contentfulFieldId: 'title' }, { id: 'description' }];

      const cleanup = initializeEntryChangeMonitoring(
        mockSdk as SidebarExtensionSDK,
        fieldMappings
      );

      // Verify listeners were set up
      expect(mockSdk.entry.fields.title.onValueChanged).toHaveBeenCalled();
      expect(mockSdk.entry.fields.description.onValueChanged).toHaveBeenCalled();

      // Test cleanup function
      expect(typeof cleanup).toBe('function');
      cleanup();
    });

    it('should handle string field IDs', () => {
      const fieldMappings = ['title', 'description'];

      initializeEntryChangeMonitoring(mockSdk as SidebarExtensionSDK, fieldMappings);

      expect(mockSdk.entry.fields.title.onValueChanged).toHaveBeenCalled();
      expect(mockSdk.entry.fields.description.onValueChanged).toHaveBeenCalled();
    });

    it('should trigger notification to backend when fields change', () => {
      const fieldMappings = [{ contentfulFieldId: 'title' }];

      // Mock the onValueChanged to immediately call the callback
      let valueChangeCallback: Function = () => {};
      mockSdk.entry.fields.title.onValueChanged.mockImplementation((callback: Function) => {
        valueChangeCallback = callback;
        return () => {}; // Return cleanup function
      });

      initializeEntryChangeMonitoring(mockSdk as SidebarExtensionSDK, fieldMappings);

      // Trigger the callback
      valueChangeCallback();

      // Verify backend notification
      expect(markEntryForSyncViaApi).toHaveBeenCalledWith('entry-123', 'blog-post', 'Blog Post');
    });

    it('should return empty cleanup function if no valid field IDs are provided', () => {
      const fieldMappings = [{ someOtherProp: 'value' } as any];

      const cleanup = initializeEntryChangeMonitoring(
        mockSdk as SidebarExtensionSDK,
        fieldMappings
      );

      expect(typeof cleanup).toBe('function');
      // No listeners should be set up
      expect(mockSdk.entry.fields.title.onValueChanged).not.toHaveBeenCalled();
    });

    it('should handle errors when setting up listeners', () => {
      const fieldMappings = [{ contentfulFieldId: 'nonexistent' }];

      // This should not throw
      const cleanup = initializeEntryChangeMonitoring(
        mockSdk as SidebarExtensionSDK,
        fieldMappings
      );

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('checkIfEntryNeedsSync', () => {
    it('should return true if fetch returns null (no sync status)', async () => {
      vi.mocked(fetchEntrySyncStatus).mockResolvedValue(null);

      const result = await checkIfEntryNeedsSync(mockSdk as SidebarExtensionSDK);

      expect(result).toBe(true);
      expect(fetchEntrySyncStatus).toHaveBeenCalledWith('entry-123', 'blog-post');
    });

    it('should return true if sync status indicates need for sync', async () => {
      vi.mocked(fetchEntrySyncStatus).mockResolvedValue({
        needsSync: true,
        lastSynced: 20230101,
        syncCompleted: true,
        entryId: 'entry-123',
        contentTypeId: 'blog-post',
      });

      const result = await checkIfEntryNeedsSync(mockSdk as SidebarExtensionSDK);

      expect(result).toBe(true);
    });

    it('should return false if sync status indicates no need for sync', async () => {
      vi.mocked(fetchEntrySyncStatus).mockResolvedValue({
        needsSync: false,
        lastSynced: 20230101,
        syncCompleted: true,
        entryId: 'entry-123',
        contentTypeId: 'blog-post',
      });

      const result = await checkIfEntryNeedsSync(mockSdk as SidebarExtensionSDK);

      expect(result).toBe(false);
    });

    it('should use provided content type ID if available', async () => {
      vi.mocked(fetchEntrySyncStatus).mockResolvedValue({
        needsSync: false,
        lastSynced: 20230101,
        syncCompleted: true,
        entryId: 'entry-123',
        contentTypeId: 'custom-content-type',
      });

      await checkIfEntryNeedsSync(mockSdk as SidebarExtensionSDK, 'custom-content-type');

      expect(fetchEntrySyncStatus).toHaveBeenCalledWith('entry-123', 'custom-content-type');
    });

    it('should return true on error', async () => {
      vi.mocked(fetchEntrySyncStatus).mockRejectedValue(new Error('API error'));

      const result = await checkIfEntryNeedsSync(mockSdk as SidebarExtensionSDK);

      expect(result).toBe(true);
    });
  });

  describe('registerPublishListener', () => {
    it('should register a listener for sys changes', () => {
      registerPublishListener(mockSdk as SidebarExtensionSDK);

      expect(mockSdk.entry.onSysChanged).toHaveBeenCalled();
    });

    it('should detect publish events and notify backend', () => {
      // Mock the onSysChanged to store and allow triggering the callback
      let sysChangeCallback: Function = () => {};
      mockSdk.entry.onSysChanged.mockImplementation((callback: Function) => {
        sysChangeCallback = callback;
        return () => {}; // Return cleanup function
      });

      registerPublishListener(mockSdk as SidebarExtensionSDK);

      // Simulate publish event
      sysChangeCallback({
        publishedVersion: 1,
        version: 1,
      });

      // Verify backend notification
      expect(markEntryForSyncViaApi).toHaveBeenCalledWith('entry-123', 'blog-post', 'Blog Post');
    });

    it('should not notify backend for non-publish events', () => {
      // Mock the onSysChanged to store and allow triggering the callback
      let sysChangeCallback: Function = () => {};
      mockSdk.entry.onSysChanged.mockImplementation((callback: Function) => {
        sysChangeCallback = callback;
        return () => {}; // Return cleanup function
      });

      registerPublishListener(mockSdk as SidebarExtensionSDK);

      // Simulate non-publish event (version doesn't match publishedVersion)
      sysChangeCallback({
        publishedVersion: 1,
        version: 2,
      });

      // Verify backend was not notified
      expect(markEntryForSyncViaApi).not.toHaveBeenCalled();
    });

    it('should show success notification when backend notification succeeds', async () => {
      // Mock the onSysChanged to store and allow triggering the callback
      let sysChangeCallback: Function = () => {};
      mockSdk.entry.onSysChanged.mockImplementation((callback: Function) => {
        sysChangeCallback = callback;
        return () => {}; // Return cleanup function
      });

      vi.mocked(markEntryForSyncViaApi).mockResolvedValue(true);

      registerPublishListener(mockSdk as SidebarExtensionSDK);

      // Simulate publish event
      sysChangeCallback({
        publishedVersion: 1,
        version: 1,
      });

      // Wait for promise to resolve
      await vi.waitFor(() => {
        expect(mockSdk.notifier.success).toHaveBeenCalled();
      });
    });

    it('should show error notification when backend notification fails', async () => {
      // Mock the onSysChanged to store and allow triggering the callback
      let sysChangeCallback: Function = () => {};
      mockSdk.entry.onSysChanged.mockImplementation((callback: Function) => {
        sysChangeCallback = callback;
        return () => {}; // Return cleanup function
      });

      vi.mocked(markEntryForSyncViaApi).mockRejectedValue(new Error('API error'));

      registerPublishListener(mockSdk as SidebarExtensionSDK);

      // Simulate publish event
      sysChangeCallback({
        publishedVersion: 1,
        version: 1,
      });

      // Wait for promise to reject
      await vi.waitFor(() => {
        expect(mockSdk.notifier.error).toHaveBeenCalled();
      });
    });
  });
});
