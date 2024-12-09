import { AnalyticsBrowser } from '@segment/analytics-next';
import { vi } from 'vitest';

export const mockSegmentAnalytics: Partial<AnalyticsBrowser> = {
  load: function () {
    return this as AnalyticsBrowser;
  },
  track: vi.fn(),
  identify: vi.fn(),
};
