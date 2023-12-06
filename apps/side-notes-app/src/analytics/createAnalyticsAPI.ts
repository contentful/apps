import type { Segment, UserConsent } from '@contentful/experience-tracking/dist/types';
import type { AnalyticsAPI, Channel } from '../types';

export const CALL_SPACE_METHOD_CHANNEL = 'callSpaceMethod';
export const CALL_APP_ANALYTICS_CHANNEL = 'appAnalytics';
export const ANALYTICS_EXPERIMENT_ID = 'widgetbuilder';

export const createAnalyticsAPI = (
  channel: Channel<typeof CALL_APP_ANALYTICS_CHANNEL>
): AnalyticsAPI => {
  return {
    trackEvent: (
      params: any,
      options?: Segment.Options,
      callback?: Segment.Callback,
      segmentKey?: string,
      eventName?: string
    ): any => {
      return channel.call(CALL_APP_ANALYTICS_CHANNEL, 'rawTrack', [
        {
          ...params,
          segmentKey,
          eventName,
        },
        options,
        callback,
      ]);
    },

    getUserConsent: () => {
      return channel.call(CALL_APP_ANALYTICS_CHANNEL, 'getUserConsent', []);
    },

    appTrackingSetup: (props: {
      segmentKey: string;
      user: Record<string, unknown>;
      userConsent: UserConsent;
    }) => {
      return channel.call(CALL_APP_ANALYTICS_CHANNEL, 'appTrackingSetup', [props]);
    },
  };
};
