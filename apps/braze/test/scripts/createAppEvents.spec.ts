import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAppEventSubscription } from '../../src/scripts/createAppEvents';
import { client } from '../../src/scripts/contentfulClientAndImports';

// Mock the contentful-management client
vi.mock('contentful-management', () => ({
  createClient: vi.fn(),
}));

// Mock the environment variables and imports
vi.mock('../../src/scripts/contentfulClientAndImports', () => {
  const mockUpsert = vi.fn();
  const mockClient = {
    appEventSubscription: {
      upsert: mockUpsert,
    },
  };

  return {
    appDefinitionId: 'test-app-def-id',
    client: mockClient,
    functionId: 'test-function-id',
    organizationId: 'test-org-id',
  };
});

describe('createAppEventSubscription', () => {
  const mockEventSubscription = {
    sys: {
      id: 'test-subscription-id',
      type: 'AppEventSubscription' as const,
      createdAt: '2025-06-26T15:25:42.330Z',
      updatedAt: '2025-06-26T15:25:42.330Z',
      appDefinition: {
        sys: {
          type: 'Link' as const,
          linkType: 'AppDefinition' as const,
          id: 'test-app-def-id',
        },
      },
      organization: {
        sys: {
          type: 'Link' as const,
          linkType: 'Organization' as const,
          id: 'test-org-id',
        },
      },
    },
    topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
    functions: {
      handler: {
        sys: {
          type: 'Link' as const,
          linkType: 'Function' as const,
          id: 'test-function-id',
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'dir').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should successfully create an app event subscription', async () => {
    vi.mocked(client.appEventSubscription.upsert).mockResolvedValue(mockEventSubscription);

    await createAppEventSubscription();

    expect(client.appEventSubscription.upsert).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        appDefinitionId: 'test-app-def-id',
      },
      {
        topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
        functions: {
          handler: {
            sys: {
              type: 'Link' as const,
              linkType: 'Function' as const,
              id: 'test-function-id',
            },
          },
        },
      }
    );

    expect(console.log).toHaveBeenCalledWith('Subscription created');
    expect(console.dir).toHaveBeenCalledWith(mockEventSubscription, { depth: 5 });
  });

  it('should handle errors when creating subscription fails', async () => {
    const error = new Error('Failed to create subscription');
    vi.mocked(client.appEventSubscription.upsert).mockRejectedValue(error);

    await createAppEventSubscription();

    expect(client.appEventSubscription.upsert).toHaveBeenCalledWith(
      {
        organizationId: 'test-org-id',
        appDefinitionId: 'test-app-def-id',
      },
      {
        topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
        functions: {
          handler: {
            sys: {
              type: 'Link' as const,
              linkType: 'Function' as const,
              id: 'test-function-id',
            },
          },
        },
      }
    );

    expect(console.error).toHaveBeenCalledWith(error);
    expect(console.log).not.toHaveBeenCalled();
    expect(console.dir).not.toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network timeout');
    vi.mocked(client.appEventSubscription.upsert).mockRejectedValue(networkError);

    await createAppEventSubscription();

    expect(console.error).toHaveBeenCalledWith(networkError);
    expect(console.log).not.toHaveBeenCalled();
    expect(console.dir).not.toHaveBeenCalled();
  });

  it('should handle API errors with status codes', async () => {
    const apiError = {
      message: 'Unauthorized',
      status: 401,
      details: 'Invalid access token',
    };
    vi.mocked(client.appEventSubscription.upsert).mockRejectedValue(apiError);

    await createAppEventSubscription();

    expect(console.error).toHaveBeenCalledWith(apiError);
    expect(console.log).not.toHaveBeenCalled();
    expect(console.dir).not.toHaveBeenCalled();
  });
});
