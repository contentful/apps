import { BaseAppSDK } from '@contentful/app-sdk';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { createContext, ReactNode } from 'react';
import { getUserCookieConsent } from '@utils/segment/cookieConsent';
import segmentEventName from '@configs/segment/segmentEventName';
import {
  SegmentAction,
  SegmentEvent,
  SegmentEventData,
  SegmentIdentify,
} from '@configs/segment/segmentEvent';

interface SegmentAnalyticsContextProps {
  identify: (sdk: BaseAppSDK) => void;
  trackEvent: (sdk: BaseAppSDK, action: SegmentAction, trackingData: Partial<SegmentEvent>) => void;
}

const noop = () => {};

export const SegmentAnalyticsContext = createContext<SegmentAnalyticsContextProps>({
  identify: noop,
  trackEvent: noop,
});

export const SegmentAnalyticsProvider = (props: { children: ReactNode }) => {
  const writeKey = (import.meta.env.VITE_SEGMENT_WRITE_KEY as string) || '';
  const segmentAnalytics = AnalyticsBrowser.load({ writeKey });

  const identify = (sdk: BaseAppSDK) => {
    if (!getUserCookieConsent(sdk, 'PERSONALIZATION')) {
      return;
    }

    const payload: SegmentIdentify = {
      environment_key: sdk.ids.environment,
      organization_key: sdk.ids.organization,
      space_key: sdk.ids.space,
    };

    segmentAnalytics.identify(sdk.ids.user, payload);
  };

  const trackEvent = (sdk: BaseAppSDK, action: SegmentAction, trackingData: SegmentEventData) => {
    if (!getUserCookieConsent(sdk, 'ANALYTICS')) {
      return;
    }

    const payload: SegmentEvent = {
      gptModel: sdk.parameters.installation.model,
      action: action,
      ...trackingData,
    };

    segmentAnalytics.track(segmentEventName, payload);
  };

  return (
    <SegmentAnalyticsContext.Provider
      value={{
        identify,
        trackEvent,
      }}>
      {props.children}
    </SegmentAnalyticsContext.Provider>
  );
};
