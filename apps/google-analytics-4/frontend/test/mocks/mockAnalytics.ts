import { AnalyticsBrowser } from '@segment/analytics-next';

export const mockAnalytics: Partial<AnalyticsBrowser> = {
  load: function () {
    return this as AnalyticsBrowser;
  },
  identify: jest.fn(),
};
