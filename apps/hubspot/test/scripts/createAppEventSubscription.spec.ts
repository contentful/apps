import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppEventSubscriptionProps, createClient, PlainClientAPI } from 'contentful-management';
import { createAppEventSubscription } from '../../src/scripts/createAppEventSubscription';
import dotenv from 'dotenv';
import path from 'path';

// Mock contentful-management
vi.mock('contentful-management', () => ({
  createClient: vi.fn(),
}));

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  dir: vi.spyOn(console, 'dir').mockImplementation(() => {}),
};

// Mock process.env
const originalEnv = process.env;

describe('addEvents.ts', () => {
  let mockClient: Partial<PlainClientAPI>;
  let mockAppEventSubscription: PlainClientAPI['appEventSubscription'];

  beforeAll(() => {
    dotenv.config({ quiet: true });
  });

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset environment variables to test values
    process.env = { ...originalEnv };
    // Setup mock client
    mockAppEventSubscription = {
      upsert: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };

    mockClient = {
      appEventSubscription: mockAppEventSubscription,
    };

    (createClient as any).mockReturnValue(mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createAppEventSubscription', () => {
    it('should successfully create app event subscription with valid environment variables', async () => {
      const mockSubscription = {
        sys: { id: 'test-subscription-id' },
        topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
      };
      mockAppEventSubscription.upsert = vi.fn().mockResolvedValue(mockSubscription);

      await createAppEventSubscription();

      expect(createClient).toHaveBeenCalledWith(
        {
          accessToken: 'test-access-token',
          host: 'api.contentful.com',
        },
        { type: 'plain' }
      );

      expect(mockAppEventSubscription.upsert).toHaveBeenCalledWith(
        {
          organizationId: 'test-org-id',
          appDefinitionId: 'test-app-def-id',
        },
        {
          topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
          functions: {
            handler: {
              sys: {
                type: 'Link',
                linkType: 'Function',
                id: 'appEventHandler',
              },
            },
          },
        }
      );

      expect(consoleSpy.log).toHaveBeenCalledWith('Subscription to events successfully created');
      expect(consoleSpy.dir).toHaveBeenCalledWith(mockSubscription, { depth: 5 });
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error: Unauthorized');
      mockAppEventSubscription.upsert = vi.fn().mockRejectedValue(mockError);

      await createAppEventSubscription();

      expect(consoleSpy.error).toHaveBeenCalledWith(mockError);
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.dir).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const mockError = new Error('Network Error: Connection timeout');
      mockAppEventSubscription.upsert = vi.fn().mockRejectedValue(mockError);

      await createAppEventSubscription();

      expect(consoleSpy.error).toHaveBeenCalledWith(mockError);
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.dir).not.toHaveBeenCalled();
    });
  });

  describe('Event subscription configuration', () => {
    it('should configure all required event topics', async () => {
      const mockSubscription = { sys: { id: 'test-subscription-id' } };
      mockAppEventSubscription.upsert = vi.fn().mockResolvedValue(mockSubscription);

      await createAppEventSubscription();

      const expectedTopics = [
        'Entry.save',
        'Entry.auto_save',
        'Entry.delete',
        'AppInstallation.delete',
      ];
      const callArgs = (mockAppEventSubscription.upsert as any).mock.calls[0];
      expect(callArgs[1].topics).toEqual(expectedTopics);
    });
  });
});
