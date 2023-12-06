import { KnownSDK } from '@contentful/app-sdk';
import { analyticsStore } from '../../stores/analytics.store';
import { sdkStore } from '../../stores/sdk.store';
import {
  AnalyticsContentTypeAssignmentEventAction,
  AnalyticsContentTypeAssignmentWidgetLocation,
  AnalyticsExperimentVariation,
} from '../../types';
import { ANALYTICS_EXPERIMENT_ID } from '../createAnalyticsAPI';

export const ContentTypeAssignmentEvent = (
  event: AnalyticsContentTypeAssignmentEventAction,
  type?: AnalyticsContentTypeAssignmentWidgetLocation
) => {
  const sdk = sdkStore.getState().sdk as KnownSDK;
  analyticsStore.getState().analyticsClient?.appsExperimentInteracted({
    action: event,
    app_definition_id: sdk.ids.app,
    experiment_id: ANALYTICS_EXPERIMENT_ID,
    experiment_variation: AnalyticsExperimentVariation.CONTENT_TYPE_ASSIGNMENT_LIFECYCLE,
    subject: type ? type : undefined,
  });
};
