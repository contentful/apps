import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PostHogClient, PostHogApiError, createPostHogClient } from '../../src/lib/posthog';

// ============================================================================
// Mocks
// ============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
});

// ============================================================================
// Test Data
// ============================================================================

const mockConfig = {
  personalApiKey: 'phx_test_key_12345',
  projectId: '12345',
  posthogHost: 'https://us.posthog.com',
};

const mockHogQLResponse = {
  results: [[150, 75]],
  columns: ['pageviews', 'unique_users'],
  types: ['UInt64', 'UInt64'],
};

const mockDailyStatsResponse = {
  results: [
    ['2026-01-06', 20, 10],
    ['2026-01-07', 25, 12],
    ['2026-01-08', 30, 15],
    ['2026-01-09', 22, 11],
    ['2026-01-10', 28, 14],
    ['2026-01-11', 35, 18],
    ['2026-01-12', 40, 20],
  ],
  columns: ['date', 'pageviews', 'unique_users'],
  types: ['Date', 'UInt64', 'UInt64'],
};

// HogQL response format for session recordings
const mockRecordingsHogQLResponse = {
  results: [
    ['rec_session_123', 'user_abc123def456', '2026-01-12T10:30:00Z', '2026-01-12T10:32:05Z', 125],
    ['rec_session_456', 'user_xyz789', '2026-01-12T09:15:00Z', '2026-01-12T09:20:00Z', 300],
  ],
  columns: ['session_id', 'distinct_id', 'first_pageview', 'last_pageview', 'duration_seconds'],
  types: ['String', 'String', 'DateTime', 'DateTime', 'Int64'],
};

// ============================================================================
// Tests
// ============================================================================

describe('PostHogClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a client with valid config', () => {
      const client = new PostHogClient(mockConfig);
      expect(client).toBeInstanceOf(PostHogClient);
    });

    it('should throw error if personalApiKey is missing', () => {
      expect(() => {
        new PostHogClient({ ...mockConfig, personalApiKey: '' });
      }).toThrow('PostHog Personal API Key is required');
    });

    it('should throw error if projectId is missing', () => {
      expect(() => {
        new PostHogClient({ ...mockConfig, projectId: '' });
      }).toThrow('PostHog Project ID is required');
    });

    it('should throw error if posthogHost is missing', () => {
      expect(() => {
        new PostHogClient({ ...mockConfig, posthogHost: '' });
      }).toThrow('PostHog host is required');
    });

    it('should strip trailing slash from host', () => {
      const client = new PostHogClient({
        ...mockConfig,
        posthogHost: 'https://us.posthog.com/',
      });
      // We can verify this indirectly through the deep link generation
      const link = client.getInsightsDeepLink('test', 'https://example.com/{slug}');
      expect(link).toContain('https://us.posthog.com/project/');
      expect(link).not.toContain('//project/');
    });
  });

  describe('getEntryStats', () => {
    it('should fetch entry stats successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHogQLResponse),
      });

      const client = new PostHogClient(mockConfig);
      const stats = await client.getEntryStats('hello-world', 'https://example.com/blog/{slug}');

      expect(stats).toEqual({
        pageviews: 150,
        uniqueUsers: 75,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/12345/query'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer phx_test_key_12345',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should return cached data on subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHogQLResponse),
      });

      const client = new PostHogClient(mockConfig);

      // First call - should fetch
      await client.getEntryStats('hello-world', 'https://example.com/blog/{slug}');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const stats = await client.getEntryStats('hello-world', 'https://example.com/blog/{slug}');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1
      expect(stats.pageviews).toBe(150);
    });

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [], columns: [], types: [] }),
      });

      const client = new PostHogClient(mockConfig);
      const stats = await client.getEntryStats('empty-page', 'https://example.com/{slug}');

      expect(stats).toEqual({
        pageviews: 0,
        uniqueUsers: 0,
      });
    });

    it('should respect date range parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHogQLResponse),
      });

      const client = new PostHogClient(mockConfig);
      await client.getEntryStats('hello-world', 'https://example.com/blog/{slug}', 'last30d');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query.query).toContain('INTERVAL 30 DAY');
    });
  });

  describe('getDailyStats', () => {
    it('should fetch daily stats and fill missing days with zeros', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDailyStatsResponse),
      });

      const client = new PostHogClient(mockConfig);
      const stats = await client.getDailyStats('hello-world', 'https://example.com/blog/{slug}');

      expect(stats).toHaveLength(7);
      expect(stats[stats.length - 1].pageviews).toBe(40);
    });

    it('should handle different date ranges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [], columns: [], types: [] }),
      });

      const client = new PostHogClient(mockConfig);
      const stats = await client.getDailyStats(
        'hello-world',
        'https://example.com/blog/{slug}',
        'last14d'
      );

      expect(stats).toHaveLength(14);
    });
  });

  describe('getRecentRecordings', () => {
    it('should fetch and transform recordings using HogQL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingsHogQLResponse),
      });

      const client = new PostHogClient(mockConfig);
      const recordings = await client.getRecentRecordings(
        'hello-world',
        'https://example.com/blog/{slug}'
      );

      expect(recordings).toHaveLength(2);
      expect(recordings[0]).toEqual({
        id: 'rec_session_123',
        distinctId: 'user_a...f456', // Truncated
        duration: 125,
        startTime: '2026-01-12T10:30:00Z',
        recordingUrl: 'https://us.posthog.com/project/12345/replay/rec_session_123',
      });
    });

    it('should use HogQL query with limit parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordingsHogQLResponse),
      });

      const client = new PostHogClient(mockConfig);
      await client.getRecentRecordings('hello-world', 'https://example.com/blog/{slug}', 3);

      // Verify HogQL query is used with limit in the query
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/12345/query'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('LIMIT 3'),
        })
      );
    });

    it('should return empty array on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = new PostHogClient(mockConfig);
      const recordings = await client.getRecentRecordings(
        'hello-world',
        'https://example.com/blog/{slug}'
      );

      // Should gracefully return empty array instead of throwing
      expect(recordings).toEqual([]);
    });
  });

  describe('deep link generation', () => {
    it('should generate insights deep link', () => {
      const client = new PostHogClient(mockConfig);
      const link = client.getInsightsDeepLink(
        'hello-world',
        'https://example.com/blog/{slug}',
        'last7d'
      );

      expect(link).toContain('https://us.posthog.com/project/12345/insights/new');
      expect(link).toContain('filters=');
      expect(link).toContain(encodeURIComponent('/blog/hello-world'));
    });

    it('should generate recordings deep link', () => {
      const client = new PostHogClient(mockConfig);
      const link = client.getRecordingsDeepLink('hello-world', 'https://example.com/blog/{slug}');

      expect(link).toContain('https://us.posthog.com/project/12345/replay');
      expect(link).toContain('filters=');
    });
  });

  describe('error handling', () => {
    it('should throw PostHogApiError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      const client = new PostHogClient(mockConfig);

      await expect(
        client.getEntryStats('hello-world', 'https://example.com/blog/{slug}')
      ).rejects.toThrow(PostHogApiError);
    });

    it('should throw PostHogApiError on 429 (rate limit)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited'),
      });

      const client = new PostHogClient(mockConfig);

      try {
        await client.getEntryStats('hello-world', 'https://example.com/blog/{slug}');
      } catch (error) {
        expect(error).toBeInstanceOf(PostHogApiError);
        expect((error as PostHogApiError).isRateLimited()).toBe(true);
      }
    });

    it('should parse JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve(JSON.stringify({ detail: 'Invalid query syntax' })),
      });

      const client = new PostHogClient(mockConfig);

      await expect(
        client.getEntryStats('hello-world', 'https://example.com/blog/{slug}')
      ).rejects.toThrow('Invalid query syntax');
    });
  });

  describe('cache management', () => {
    it('should clear cache for the project', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHogQLResponse),
      });

      const client = new PostHogClient(mockConfig);

      // Populate cache
      await client.getEntryStats('hello-world', 'https://example.com/blog/{slug}');
      expect(sessionStorageMock.setItem).toHaveBeenCalled();

      // Clear cache
      client.clearCache();
      expect(sessionStorageMock.removeItem).toHaveBeenCalled();
    });
  });
});

describe('createPostHogClient', () => {
  it('should create client with valid params', () => {
    const client = createPostHogClient({
      personalApiKey: 'phx_test',
      projectId: '123',
      posthogHost: 'https://us.posthog.com',
    });

    expect(client).toBeInstanceOf(PostHogClient);
  });

  it('should throw if params are missing', () => {
    expect(() => createPostHogClient({})).toThrow(
      'PostHog app is not configured. Please complete the configuration.'
    );

    expect(() => createPostHogClient({ personalApiKey: 'test' })).toThrow();
  });
});

describe('PostHogApiError', () => {
  it('should identify auth errors', () => {
    const error401 = new PostHogApiError('Unauthorized', 401);
    const error403 = new PostHogApiError('Forbidden', 403);
    const error500 = new PostHogApiError('Server Error', 500);

    expect(error401.isAuthError()).toBe(true);
    expect(error403.isAuthError()).toBe(true);
    expect(error500.isAuthError()).toBe(false);
  });

  it('should identify rate limit errors', () => {
    const error429 = new PostHogApiError('Rate limited', 429);
    const error500 = new PostHogApiError('Server Error', 500);

    expect(error429.isRateLimited()).toBe(true);
    expect(error500.isRateLimited()).toBe(false);
  });
});
