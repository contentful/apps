import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import contentful from 'contentful-management';
import type { PlainClientAPI } from 'contentful-management';
import { createAppEventSubscription } from '../createAppEventSubscription.ts';

// Mock contentful-management
vi.mock('contentful-management', () => ({
  default: { createClient: vi.fn() },
}));

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  dir: vi.spyOn(console, 'dir').mockImplementation(() => {}),
};

// Test constants
const TEST_ORG_ID = 'org-id';
const TEST_APP_DEF_ID = 'app-def-id';
const TEST_ACCESS_TOKEN = 'access-token';
const TEST_FUNCTION_ID = 'appEventHandler';
const TEST_SPACE_ID = 'test-space';
const TEST_ENVIRONMENT_ID = 'test-env';

// Mock process.env
const originalEnv = process.env;

describe('addEvents.ts', () => {
  let mockClient: Partial<PlainClientAPI>;
  let mockAppEventSubscription: PlainClientAPI['appEventSubscription'];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset environment variables
    process.env = { ...originalEnv };

    // Set test environment variables from constants
    process.env.CONTENTFUL_ORG_ID = TEST_ORG_ID;
    process.env.CONTENTFUL_APP_DEF_ID = TEST_APP_DEF_ID;
    process.env.CONTENTFUL_ACCESS_TOKEN = TEST_ACCESS_TOKEN;
    process.env.CONTENTFUL_FUNCTION_ID = TEST_FUNCTION_ID;
    process.env.SPACE_ID = 'test-space';
    process.env.ENVIRONMENT_ID = 'test-env';

    // Setup mock client
    mockAppEventSubscription = {
      upsert: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    };

    mockClient = {
      appEventSubscription: mockAppEventSubscription,
    };

    (contentful.createClient as any).mockReturnValue(mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createAppEventSubscription', () => {
    it('should successfully create app event subscription with valid variables', async () => {
      const mockSubscription = {
        sys: { id: 'test-subscription-id' },
        topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
      };
      mockAppEventSubscription.upsert = vi.fn().mockResolvedValue(mockSubscription);

      await createAppEventSubscription();

      expect(contentful.createClient).toHaveBeenCalledWith(
        {
          accessToken: TEST_ACCESS_TOKEN,
        },
        {
          type: 'plain',
          defaults: {
            spaceId: TEST_SPACE_ID,
            environmentId: TEST_ENVIRONMENT_ID,
          },
        }
      );

      expect(mockAppEventSubscription.upsert).toHaveBeenCalledWith(
        {
          organizationId: TEST_ORG_ID,
          appDefinitionId: TEST_APP_DEF_ID,
        },
        {
          topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
          functions: {
            handler: {
              sys: {
                type: 'Link',
                linkType: 'Function',
                id: TEST_FUNCTION_ID,
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
