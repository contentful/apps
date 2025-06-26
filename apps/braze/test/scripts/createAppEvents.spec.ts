import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// Import the function to test
import { createAppEventSubscription } from '../../src/scripts/createAppEvents';
import { client } from '../../src/scripts/contentfulClientAndImports';

describe('createAppEventSubscription', () => {
  const mockEventSubscription = {
    sys: {
      id: 'test-subscription-id',
      type: 'AppEventSubscription',
    },
    topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
    functions: {
      handler: {
        sys: {
          type: 'Link',
          linkType: 'Function',
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
              type: 'Link',
              linkType: 'Function',
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
              type: 'Link',
              linkType: 'Function',
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

  it('should call upsert with correct parameters structure', async () => {
    vi.mocked(client.appEventSubscription.upsert).mockResolvedValue(mockEventSubscription);

    await createAppEventSubscription();

    const upsertCall = vi.mocked(client.appEventSubscription.upsert).mock.calls[0];
    expect(upsertCall).toHaveLength(2);

    // Check first parameter (filter)
    expect(upsertCall[0]).toEqual({
      organizationId: 'test-org-id',
      appDefinitionId: 'test-app-def-id',
    });

    // Check second parameter (data)
    expect(upsertCall[1]).toEqual({
      topics: ['Entry.save', 'Entry.auto_save', 'Entry.delete', 'AppInstallation.delete'],
      functions: {
        handler: {
          sys: {
            type: 'Link',
            linkType: 'Function',
            id: 'test-function-id',
          },
        },
      },
    });
  });

  it('should include all required topics in the subscription', async () => {
    vi.mocked(client.appEventSubscription.upsert).mockResolvedValue(mockEventSubscription);

    await createAppEventSubscription();

    const upsertCall = vi.mocked(client.appEventSubscription.upsert).mock.calls[0];
    const topics = upsertCall[1].topics;

    expect(topics).toContain('Entry.save');
    expect(topics).toContain('Entry.auto_save');
    expect(topics).toContain('Entry.delete');
    expect(topics).toContain('AppInstallation.delete');
    expect(topics).toHaveLength(4);
  });

  it('should configure the function handler correctly', async () => {
    vi.mocked(client.appEventSubscription.upsert).mockResolvedValue(mockEventSubscription);

    await createAppEventSubscription();

    const upsertCall = vi.mocked(client.appEventSubscription.upsert).mock.calls[0];
    const functions = upsertCall[1].functions;

    expect(functions.handler.sys).toEqual({
      type: 'Link',
      linkType: 'Function',
      id: 'test-function-id',
    });
  });
});
