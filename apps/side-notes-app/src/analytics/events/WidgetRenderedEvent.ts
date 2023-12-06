import { WidgetRenderLocation, WidgetType } from '../../types';
import { sdkStore } from '../../stores/sdk.store';
import { KnownSDK } from '@contentful/app-sdk';
import { analyticsStore } from '../../stores/analytics.store';
import { ANALYTICS_EXPERIMENT_ID } from '../createAnalyticsAPI';

export const WidgetRenderedEvent = (
  widgets: WidgetType[] | undefined = [],
  location: WidgetRenderLocation,
  fieldType?: string
) => {
  const sdk = sdkStore.getState().sdk as KnownSDK;

  analyticsStore.getState().analyticsClient?.appsExperimentInteracted({
    action: 'WidgetsRendered',
    app_definition_id: sdk.ids.app,
    experiment_id: ANALYTICS_EXPERIMENT_ID,
    subject: location,
    experiment_variation: fieldType || '',
    context: JSON.stringify({ widgets }),
  });
};
