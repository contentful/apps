import { ConfigAppSDK, DialogAppSDK, SidebarAppSDK } from '@contentful/app-sdk';
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
import getTrackedAppData from '@utils/segment/getTrackedAppData';
import { AppInstallationParameters } from '@locations/ConfigScreen';
import { useSDK } from '@contentful/react-apps-toolkit';

interface SegmentAnalyticsContextProps {
  identify: () => void;
  trackEvent: (action: SegmentAction, trackingData?: SegmentEventData) => void;
}

type PossibleSDK =
  | SidebarAppSDK<AppInstallationParameters>
  | DialogAppSDK<AppInstallationParameters>
  | ConfigAppSDK<AppInstallationParameters>;

const noop = () => {};

export const SegmentAnalyticsContext = createContext<SegmentAnalyticsContextProps>({
  identify: noop,
  trackEvent: noop,
});

export const SegmentAnalyticsProvider = (props: { children: ReactNode }) => {
  const writeKey = (import.meta.env.VITE_SEGMENT_WRITE_KEY as string) || '';
  const sdk = useSDK<PossibleSDK>();

  const segmentAnalytics = getUserCookieConsent(sdk, 'ANALYTICS')
    ? AnalyticsBrowser.load({ writeKey })
    : null;

  const identify = () => {
    if (!segmentAnalytics || !getUserCookieConsent(sdk, 'PERSONALIZATION')) {
      return;
    }

    const payload: SegmentIdentify = {
      environment_key: sdk.ids.environmentAlias || sdk.ids.environment,
      organization_key: sdk.ids.organization,
      space_key: sdk.ids.space,
    };

    segmentAnalytics.identify(sdk.ids.user, payload);
  };

  const trackEvent = (action: SegmentAction, eventData: SegmentEventData = {}) => {
    if (!segmentAnalytics) {
      return;
    }

    const payload: SegmentEvent = {
      action: action,
      ...getTrackedAppData(sdk),
      ...eventData,
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
