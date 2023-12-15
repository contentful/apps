import { ConfigAppSDK, DialogAppSDK, SidebarAppSDK } from '@contentful/app-sdk';
import { AnalyticsBrowser } from '@segment/analytics-next';
import { createContext, ReactNode } from 'react';
import { getUserCookieConsent } from '@utils/segment/cookieConsent';
import { SegmentEvent, SegmentEventData, SegmentIdentify } from '@configs/segment/segmentEvent';
import getTrackedAppData from '@utils/segment/getTrackedAppData';
import { useSDK } from '@contentful/react-apps-toolkit';
import { SegmentEvents } from '@configs/segment/segmentEvent';
import AppInstallationParameters from '@components/config/appInstallationParameters';

interface SegmentAnalyticsContextProps {
  identify: () => void;
  trackEvent: (action: SegmentEvents, trackingData?: SegmentEventData) => void;
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
  const writeKey = (import.meta.env.VITE_AICG_SEGMENT_WRITE_KEY as string) || '';
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

  const trackEvent = (segmentEvent: SegmentEvents, eventData: SegmentEventData = {}) => {
    if (!segmentAnalytics) {
      return;
    }

    const payload: SegmentEvent = {
      ...getTrackedAppData(sdk),
      ...eventData,
    };

    segmentAnalytics.track(segmentEvent, payload);
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
