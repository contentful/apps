import type { KnownSDK } from '@contentful/app-sdk';
import { createAppAdapter } from '@contentful/experience-tracking';
import type { UserConsent } from '@contentful/experience-tracking';
import { getSegmentConfig } from './config';

import { sdkStore } from '../stores/sdk.store';

import * as segmentPlan from './segment/plan';
import { AnalyticsAPI } from '../types';

// with these being optional, we don't have to set them for every event
type SharedEventProps = {
  space_key?: string;
  organization_key?: string;
  environment_key?: string;
};

export type AnalyticsClient = ReturnType<typeof createAnalyticsClient>;

export const createAnalyticsClient = (internalSdk: AnalyticsAPI) => {
  const segment = {
    key: getSegmentConfig().key,
    plan: segmentPlan,
  };
  return createAppAdapter<SharedEventProps, typeof segmentPlan, AnalyticsAPI>(
    { segment },
    internalSdk
  );
};

export const initializeAnalyticClient = async (
  client: AnalyticsClient,
  analyticsAPI: AnalyticsAPI,
  userConsent: UserConsent
) => {
  const sdk = sdkStore.getState().sdk as KnownSDK;

  const {
    space: space_key,
    organization: organization_key,
    environment: environment_key,
    user,
  } = sdk.ids;

  const newTrackingOptions = {
    shared: {
      space_key,
      organization_key,
      environment_key,
    },
    user: {},
    consent: {
      analytics: userConsent.userInterface?.consentRecord?.ANALYTICS === 'ACCEPT',
      personalization: userConsent.userInterface?.consentRecord?.PERSONALIZATION === 'ACCEPT',
    },
    integrations: [],
  };

  if (userConsent.userInterface?.consentRecord?.PERSONALIZATION === 'ACCEPT') {
    newTrackingOptions.user = {
      id: sdk.user.sys.id,
      email: sdk.user.email,
      firstName: sdk.user.firstName,
      lastName: sdk.user.lastName,
    };
  }

  await client.initialize(user, newTrackingOptions);

  await analyticsAPI.appTrackingSetup({
    segmentKey: getSegmentConfig().key,
    user: {
      id: sdk.user.sys.id,
      email: sdk.user.email,
      firstName: sdk.user.firstName,
      lastName: sdk.user.lastName,
    },
    userConsent,
  });
};
