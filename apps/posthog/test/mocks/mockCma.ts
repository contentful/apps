import { vi } from 'vitest';

// Default analytics response
const defaultAnalyticsResponse = {
  response: {
    body: JSON.stringify({
      success: true,
      data: {
        pageViews: 100,
        uniqueVisitors: 50,
        avgSessionDuration: 120,
        dateRange: 'last7days',
        pageUrl: 'https://example.com/blog/my-test-post',
      },
    }),
  },
};

// Default recordings response
const defaultRecordingsResponse = {
  response: {
    body: JSON.stringify({
      success: true,
      data: {
        recordings: [],
        hasMore: false,
      },
    }),
  },
};

// Default feature flags response
const defaultFeatureFlagsResponse = {
  response: {
    body: JSON.stringify({
      success: true,
      data: {
        flags: [],
        totalCount: 0,
      },
    }),
  },
};

export const mockCma: any = {
  appActionCall: {
    createWithResponse: vi.fn().mockImplementation((params, body) => {
      const actionId = params.appActionId;
      if (actionId === 'queryAnalytics') {
        return Promise.resolve(defaultAnalyticsResponse);
      }
      if (actionId === 'listRecordings') {
        return Promise.resolve(defaultRecordingsResponse);
      }
      if (actionId === 'listFeatureFlags') {
        return Promise.resolve(defaultFeatureFlagsResponse);
      }
      if (actionId === 'toggleFeatureFlag') {
        return Promise.resolve({
          response: {
            body: JSON.stringify({
              success: true,
              data: { flag: { id: body.parameters.flagId, active: body.parameters.active } },
            }),
          },
        });
      }
      if (actionId === 'validateConnection') {
        return Promise.resolve({
          response: {
            body: JSON.stringify({
              success: true,
              data: { projectName: 'Test Project', organizationName: 'Test Org' },
            }),
          },
        });
      }
      return Promise.resolve(defaultAnalyticsResponse);
    }),
  },
  contentType: {
    getMany: vi.fn().mockResolvedValue({
      items: [
        {
          sys: { id: 'blogPost' },
          name: 'Blog Post',
          fields: [
            { id: 'title', name: 'Title', type: 'Symbol' },
            { id: 'slug', name: 'Slug', type: 'Symbol' },
            { id: 'content', name: 'Content', type: 'RichText' },
          ],
        },
      ],
    }),
  },
};
