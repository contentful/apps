import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { productsList } from '../__mocks__';
import { integration } from '../__mocks__/storybook/integration';
import { IntegrationProvider } from './IntegrationContext';
import { Integration } from '../types';
import { decorators } from '../__mocks__/storybook/decorators';
import { SortableComponent } from './SortableComponent';
import { sdk } from '../__mocks__/storybook/sdk';

type Args = typeof SortableComponent & Pick<Integration, 'productCardVersion'>;

const meta: Meta<Args> = {
  component: SortableComponent,
  tags: ['autodocs'],
  argTypes: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    productCardVersion: {
      options: ['v1', 'v2'],
      control: { type: 'radio' },
      defaultValue: 'v1',
    },
  },
  decorators: [decorators.WithFixedWidth()],
};

export default meta;

type Story = StoryObj<typeof SortableComponent>;

export const Default: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    sdk: sdk,
    disabled: false,
    onChange: (newSkus: string[]) => {
      // it'd be a nice to have, if this would actually update productsList and the UI, but storybook
      // does not rerender unless args are directly changed, and I can't find a workaround in a reasonable
      // amount of time.  So just console logging for now.
      console.log('[ SortableComponent.stories.tsx ] onChange() new SKUs:', newSkus);
    },
    config: {},
    skus: productsList.map((p) => p.sku),
    fetchProductPreviews: async () => {
      return productsList;
    },
  },
  render: (args) => {
    return (
      <IntegrationProvider
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        integration={integration({ productCardVersion: args.productCardVersion })}>
        <SortableComponent {...args} />
      </IntegrationProvider>
    );
  },
};
