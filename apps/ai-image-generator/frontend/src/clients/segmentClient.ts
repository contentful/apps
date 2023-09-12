import { config } from '../configs/config';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { KnownSDK } from '@contentful/app-sdk';
import { getUserCookieConsent } from './cookieConsent';

let clientInstance: SegmentClient;

class SegmentClient {
  segmentAnalytics: AnalyticsBrowser;

  constructor() {
    const writeKey = config.segmentWriteKey;
    this.segmentAnalytics = AnalyticsBrowser.load({ writeKey });

    if (clientInstance) {
      throw new Error('You can only create one instance of SegmentClient');
    }
    clientInstance = this;
  }

  identify(sdk: KnownSDK) {
    if (getUserCookieConsent(sdk, 'PERSONALIZATION')) {
      this.segmentAnalytics.identify();
    }
  }

  trackLocation(sdk: KnownSDK, location: string) {
    if (getUserCookieConsent(sdk, 'ANALYTICS')) {
      this.segmentAnalytics.page(location);
    }
  }
}

const singletonClient = new SegmentClient();
export default singletonClient;
