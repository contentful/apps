import { KnownSDK } from '@contentful/app-sdk';
import { analyticsStore } from '../../stores/analytics.store';
import { sdkStore } from '../../stores/sdk.store';
import {
  WidgetLocationEventAction,
  AnalyticsExperimentVariation,
  WidgetType,
  AnalyticsContentTypeAssignmentWidgetLocation,
} from '../../types';
import { ANALYTICS_EXPERIMENT_ID } from '../createAnalyticsAPI';

export const WidgetLocationEvent = (
  event: WidgetLocationEventAction,
  widgetLocation: AnalyticsContentTypeAssignmentWidgetLocation,
  type?: WidgetType
) => {
  const sdk = sdkStore.getState().sdk as KnownSDK;

  analyticsStore.getState().analyticsClient?.appsExperimentInteracted({
    action: event,
    app_definition_id: sdk.ids.app,
    experiment_id: ANALYTICS_EXPERIMENT_ID,
    value: widgetLocation,
    experiment_variation: AnalyticsExperimentVariation.WIDGET_LOCATION_LIFECYCLE,
    subject: type,
  });
};
