import { config } from 'config';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { KnownSDK } from '@contentful/app-sdk';
import { getUserCookieConsent } from 'utils/cookieConsent';

export class SegmentClient {
  readonly sdk: KnownSDK;
  segmentAnalytics: AnalyticsBrowser;

  constructor(sdk: KnownSDK) {
    this.sdk = sdk;
    const writeKey = config.segmentWriteKey;
    this.segmentAnalytics = AnalyticsBrowser.load({ writeKey });
  }

  identify() {
    if (getUserCookieConsent(this.sdk, 'PERSONALIZATION')) {
      this.segmentAnalytics.identify();
    }
  }

  trackLocation(location: string) {
    // console.log('trackLocation', location);
    if (getUserCookieConsent(this.sdk, 'ANALYTICS')) {
      this.segmentAnalytics.page(location);
    }
  }
}
