import type { UserConsent, Segment } from '@contentful/experience-tracking';
import {
  CALL_APP_ANALYTICS_CHANNEL,
  CALL_SPACE_METHOD_CHANNEL,
} from '../analytics/createAnalyticsAPI';

export interface Channel<T> {
  send(event: string, ...args: Array<any>): Promise<any>;

  call(channelName: T, methodName: string, args?: Array<any>): Promise<any>;

  addHandler<V>(channelName: T, callback: (value: V) => void): void;
}

export type Channels = typeof CALL_SPACE_METHOD_CHANNEL | typeof CALL_APP_ANALYTICS_CHANNEL;

export interface AnalyticsAPI {
  trackEvent(
    params: any,
    options?: Segment.Options,
    callback?: Segment.Callback,
    segmentKey?: string,
    eventName?: string
  ): Promise<void>;

  getUserConsent(): Promise<UserConsent>;

  appTrackingSetup(props: {
    segmentKey: string;
    user: Record<string, unknown>;
    userConsent: UserConsent;
  }): Promise<void>;
}

export interface CustomAPI {
  analytics: AnalyticsAPI;
}

export enum WidgetLocationEventAction {
  NEW_WIDGET_ADDED = 'NewWidgetAdded',
  WIDGET_MOVED = 'WidgetMoved',
  WIDGET_PROP_EDITED = 'WidgetPropEdited',
  WIDGET_DELETED = 'WidgetDeleted',
}

export enum AnalyticsContentTypeAssignmentEventAction {
  CREATE = 'Create',
  DELETE = 'Delete',
  LOCATION_ADDED = 'LocationAdded',
  WIDGET_SAVED = 'WidgetSaved',
}

export enum AnalyticsContentTypeAssignmentWidgetLocation {
  SIDEBAR = 'SIDEBAR',
  FIELD = 'FIELD',
}

export enum AnalyticsExperimentVariation {
  CONTENT_TYPE_ASSIGNMENT_LIFECYCLE = 'ContentTypeAssignment',
  WIDGET_LOCATION_LIFECYCLE = 'WidgetLocationLifecycle',
}
