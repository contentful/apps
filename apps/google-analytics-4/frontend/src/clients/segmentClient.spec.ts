import SegmentClient from './segmentClient';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { vi } from 'vitest';

describe('SegmentClient', () => {
  let segmentAnalytics: any;

  const allPermissionsSDK: any = {
    user: {
      consentRecord: {
        userInterface: {
          consentRecord: {
            PERSONALIZATION: 'ACCEPT',
            ANALYTICS: 'ACCEPT',
          },
        },
      },
    },
  };

  const noPermissionsSDK: any = {
    user: {
      consentRecord: {
        userInterface: {
          consentRecord: {
            PERSONALIZATION: 'DENY',
            ANALYTICS: 'DENY',
          },
        },
      },
    },
  };

  beforeEach(() => {
    // mock AnalyticsBrowser.load() in the SegmentClient
    const mockAnalyticsBrowser: Partial<AnalyticsBrowser> = {
      load: function () {
        return this as AnalyticsBrowser;
      },
      identify: vi.fn(),
    };
    vi.spyOn(AnalyticsBrowser, 'load').mockReturnValue(mockAnalyticsBrowser as AnalyticsBrowser);

    segmentAnalytics = {
      identify: vi.fn(),
      page: vi.fn(),
    };
    SegmentClient.segmentAnalytics = segmentAnalytics;
  });
  it('should call segmentAnalytics.identify() when cookie consent is given', () => {
    SegmentClient.identify(allPermissionsSDK);
    expect(segmentAnalytics.identify).toHaveBeenCalled();
  });
  it('should not call segmentAnalytics.identify() when cookie consent is not given', () => {
    SegmentClient.identify(noPermissionsSDK);
    expect(segmentAnalytics.identify).not.toHaveBeenCalled();
  });
  it('should call segmentAnalytics.page() when cookie consent is given', () => {
    SegmentClient.trackLocation(allPermissionsSDK, 'test-location');
    expect(segmentAnalytics.page).toHaveBeenCalledWith('test-location');
  });
  it('should not call segmentAnalytics.page() when cookie consent is not given', () => {
    SegmentClient.trackLocation(noPermissionsSDK, 'test-location');
    expect(segmentAnalytics.page).not.toHaveBeenCalledWith('test-location');
  });
});
