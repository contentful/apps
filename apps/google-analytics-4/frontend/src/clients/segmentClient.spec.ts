import { SegmentClient } from './segmentClient';
import { AnalyticsBrowser } from '@segment/analytics-next';

describe('SegmentClient', () => {
  let segmentClient: SegmentClient;
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
      identify: jest.fn(),
    };
    jest.spyOn(AnalyticsBrowser, 'load').mockReturnValue(mockAnalyticsBrowser as AnalyticsBrowser);
  });
  it('should call segmentAnalytics.identify() when cookie consent is given', () => {
    segmentClient = new SegmentClient(allPermissionsSDK);
    // mock segmentAnalytics in the SegmentClient
    segmentAnalytics = {
      identify: jest.fn(),
    };
    segmentClient.segmentAnalytics = segmentAnalytics;

    segmentClient.identify();
    expect(segmentAnalytics.identify).toHaveBeenCalled();
  });
  it('should not call segmentAnalytics.identify() when cookie consent is not given', () => {
    segmentClient = new SegmentClient(noPermissionsSDK);
    segmentAnalytics = {
      identify: jest.fn(),
    };
    segmentClient.segmentAnalytics = segmentAnalytics;

    segmentClient.identify();
    expect(segmentAnalytics.identify).not.toHaveBeenCalled();
  });
  it('should call segmentAnalytics.page() when cookie consent is given', () => {
    segmentClient = new SegmentClient(allPermissionsSDK);
    segmentAnalytics = {
      page: jest.fn(),
    };
    segmentClient.segmentAnalytics = segmentAnalytics;

    segmentClient.trackLocation('test-location');
    expect(segmentAnalytics.page).toHaveBeenCalledWith('test-location');
  });
  it('should not call segmentAnalytics.page() when cookie consent is not given', () => {
    segmentClient = new SegmentClient(noPermissionsSDK);
    segmentAnalytics = {
      page: jest.fn(),
    };
    segmentClient.segmentAnalytics = segmentAnalytics;
    segmentClient.trackLocation('test-location');
    expect(segmentAnalytics.page).not.toHaveBeenCalledWith('test-location');
  });
});
