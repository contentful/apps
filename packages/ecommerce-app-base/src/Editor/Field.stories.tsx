import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { IntegrationProvider } from './IntegrationContext';
import { sdk } from '../__mocks__/storybook/sdk';
import { GlobalStyles } from '@contentful/f36-components';
import { parameters } from '../../.storybook/parameters';
import { KnownAppSDK } from '@contentful/app-sdk';
import { integration } from '../__mocks__/storybook/integration';
import { productsList } from '../__mocks__';

const meta: Meta<typeof Field> = {
  component: Field,
  tags: ['autodocs'],
  ...parameters,
};

export default meta;

type Story = StoryObj<typeof Field>;

export const Version1SingleProduct: Story = {
  decorators: [
    (Story) => (
      <IntegrationProvider integration={integration('v1', [productsList[0]])}>
        <GlobalStyles />
        <SDKContext.Provider value={{ sdk: sdk as KnownAppSDK }}>
          <Story />
        </SDKContext.Provider>
      </IntegrationProvider>
    ),
  ],
};

export const Version1MultipleProducts: Story = {
  decorators: [
    (Story) => (
      <IntegrationProvider integration={integration('v1')}>
        <GlobalStyles />
        <SDKContext.Provider value={{ sdk: sdk as KnownAppSDK }}>
          <Story />
        </SDKContext.Provider>
      </IntegrationProvider>
    ),
  ],
};

export const Version1AdditionalDataRendererDefined: Story = {
  decorators: [
    (Story) => (
      <IntegrationProvider integration={{ ...integration('v1'), renderAdditionalData: () => null }}>
        <GlobalStyles />
        <SDKContext.Provider value={{ sdk: sdk as KnownAppSDK }}>
          <Story />
        </SDKContext.Provider>
      </IntegrationProvider>
    ),
  ],
};

export const Version2SingleProduct: Story = {
  decorators: [
    (Story) => (
      <IntegrationProvider integration={integration('v2', [productsList[0]])}>
        <GlobalStyles />
        <SDKContext.Provider value={{ sdk: sdk as KnownAppSDK }}>
          <Story />
        </SDKContext.Provider>
      </IntegrationProvider>
    ),
  ],
};

export const Version2MultipleProducts: Story = {
  decorators: [
    (Story) => (
      <IntegrationProvider integration={integration('v2')}>
        <GlobalStyles />
        <SDKContext.Provider value={{ sdk: sdk as KnownAppSDK }}>
          <Story />
        </SDKContext.Provider>
      </IntegrationProvider>
    ),
  ],
};
