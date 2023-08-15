import type { Meta, StoryObj } from '@storybook/react';
import productPreviews from '../__mocks__/productPreviews';
import Field from './Field';
import logo from '../__mocks__/logo.svg';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { IntegrationProvider } from './IntegrationContext';
import { sdk } from '../__mocks__/storybook/sdk';
import { GlobalStyles } from '@contentful/f36-components';

const meta: Meta<typeof Field> = {
  component: Field,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Field>;

const integration = {
  sdk,
  logo,
  makeCTA: () => 'Select SKU',
  fetchProductPreviews: () => Promise.resolve(productPreviews),
  skuTypes: [{ id: 'product', name: 'Product' }],
  isDisabled: () => false,
  openDialog: (_, currentValue: string) => alert(currentValue),
};

export const Default: Story = {
  decorators: [
    (Story) => (
      <IntegrationProvider integration={integration}>
        <GlobalStyles />
        <SDKContext.Provider value={{ sdk }}>
          <Story />
        </SDKContext.Provider>
      </IntegrationProvider>
    ),
  ],
};
