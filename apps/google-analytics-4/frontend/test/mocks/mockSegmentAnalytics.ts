import { AnalyticsBrowser } from '@segment/analytics-next';

export const mockSegmentAnalytics: Partial<AnalyticsBrowser> = {
  load: function () {
    return this as AnalyticsBrowser;
  },
  track: jest.fn(),
  identify: jest.fn(),
};
