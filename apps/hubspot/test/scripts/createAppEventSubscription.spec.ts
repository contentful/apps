import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from 'contentful-management';
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
  let mockClient: any;
  let mockAppEventSubscription: any;

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
      // Arrange
      const mockSubscription = {
        sys: { id: 'test-subscription-id' },
        topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
      };

      mockAppEventSubscription.upsert.mockResolvedValue(mockSubscription);

      // Act
      await createAppEventSubscription();

      // Assert
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
      // Arrange
      const mockError = new Error('API Error: Unauthorized');
      mockAppEventSubscription.upsert.mockRejectedValue(mockError);

      // Act
      await createAppEventSubscription();

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(mockError);
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.dir).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockError = new Error('Network Error: Connection timeout');
      mockAppEventSubscription.upsert.mockRejectedValue(mockError);

      // Act
      await createAppEventSubscription();

      // Assert
      expect(consoleSpy.error).toHaveBeenCalledWith(mockError);
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.dir).not.toHaveBeenCalled();
    });
  });

  describe('Event subscription configuration', () => {
    it('should configure all required event topics', async () => {
      // Arrange
      const mockSubscription = { sys: { id: 'test-subscription-id' } };
      mockAppEventSubscription.upsert.mockResolvedValue(mockSubscription);

      // Act
      await createAppEventSubscription();

      // Assert
      const expectedTopics = [
        'Entry.save',
        'Entry.auto_save',
        'Entry.delete',
        'AppInstallation.delete',
      ];
      const callArgs = mockAppEventSubscription.upsert.mock.calls[0];
      expect(callArgs[1].topics).toEqual(expectedTopics);
    });
  });
});
