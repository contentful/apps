import type { Meta, StoryObj } from '@storybook/react';
import productPreviews from '../__mocks__/productPreviews';
import { Field } from './Field';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logo from '../__mocks__/logo.svg';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { IntegrationProvider } from './IntegrationContext';
import { sdk } from '../__mocks__/storybook/sdk';
import { GlobalStyles } from '@contentful/f36-components';
import { Integration } from '../types';
import { parameters } from '../../.storybook/parameters';

const meta: Meta<typeof Field> = {
  component: Field,
  tags: ['autodocs'],
  ...parameters,
};

export default meta;

type Story = StoryObj<typeof Field>;

const integration: Integration = {
  logo,
  color: '##ffff',
  description: 'some description',
  name: 'ecommerce integration',
  isInOrchestrationEAP: false,
  parameterDefinitions: [],
  skuTypes: [{ id: 'product', name: 'Product' }],
  makeCTA: () => 'Select SKU',
  isDisabled: () => false,
  renderDialog: () => {},
  openDialog: (_, currentValue: string) => {
    alert(currentValue);
    return Promise.resolve([] as string[]);
  },
  validateParameters: () => '',
  fetchProductPreviews: () => Promise.resolve(productPreviews),
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
