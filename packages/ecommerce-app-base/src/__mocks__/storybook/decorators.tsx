/* eslint-disable react/display-name */
import { IntegrationProvider } from '../../Editor';
import { integration } from './integration';
import { Integration } from '../../types';
import { productsList } from '../products';
import { sdk } from './sdk';
import { KnownAppSDK } from '@contentful/app-sdk';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { StoryFn } from '@storybook/react';

export const decorators = {
  WithIntegrationProvider: (integrationOverride: Partial<Integration>, products = productsList) => {
    return (Story: StoryFn) => (
      <IntegrationProvider integration={integration(integrationOverride, products)}>
        <Story />
      </IntegrationProvider>
    );
  },
  WithSDKProvider: (sdkOverride?: KnownAppSDK) => {
    return (Story: StoryFn) => (
      <SDKContext.Provider value={{ sdk: sdkOverride ?? (sdk as KnownAppSDK) }}>
        <Story />
      </SDKContext.Provider>
    );
  },
  WithFixedWidth: (width = '700px') => {
    return (Story: StoryFn) => (
      <div style={{ width }}>
        <Story />
      </div>
    );
  },
};
