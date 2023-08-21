import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { integration } from '../__mocks__/storybook/integration';
import { productsList } from '../__mocks__';
import { decorators } from '../__mocks__/storybook/decorators';

const meta: Meta<typeof Field> = {
  component: Field,
  tags: ['autodocs'],
  decorators: [decorators.WithSDKProvider(), decorators.WithFixedWidth()],
};

export default meta;

type Story = StoryObj<typeof Field>;

export const Version1SingleProduct: Story = {
  decorators: [
    decorators.WithIntegrationProvider(
      integration(
        {
          productCardVersion: 'v1',
        },
        [productsList[0]]
      )
    ),
  ],
};

export const Version1MultipleProducts: Story = {
  decorators: [
    decorators.WithIntegrationProvider(
      integration({
        productCardVersion: 'v1',
      })
    ),
  ],
};

export const Version1AdditionalDataRendererDefined: Story = {
  decorators: [
    decorators.WithIntegrationProvider(
      integration({
        productCardVersion: 'v1',
        additionalDataRenderer: () => null,
      })
    ),
  ],
};

export const Version2SingleProduct: Story = {
  decorators: [
    decorators.WithIntegrationProvider(
      integration(
        {
          productCardVersion: 'v2',
        },
        [productsList[0]]
      )
    ),
  ],
};

export const Version2MultipleProducts: Story = {
  decorators: [
    decorators.WithIntegrationProvider(
      integration({
        productCardVersion: 'v2',
      })
    ),
  ],
};
