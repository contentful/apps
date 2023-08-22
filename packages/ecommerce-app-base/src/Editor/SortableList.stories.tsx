import type { Meta, StoryObj } from '@storybook/react';
import { productsList } from '../__mocks__';
import { SortableList } from './SortableList';
import { integration } from '../__mocks__/storybook/integration';
import { IntegrationProvider } from './IntegrationContext';
import { Integration } from '../types';
import { decorators } from '../__mocks__/storybook/decorators';

type Args = typeof SortableList & Pick<Integration, 'productCardVersion'>;

const meta: Meta<Args> = {
  component: SortableList,
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

type Story = StoryObj<typeof SortableList>;

export const Default: Story = {
  args: {
    skuType: 'Product',
    productPreviews: productsList,
    disabled: false,
    deleteFn: () => {},
  },
  render: (args) => {
    return (
      <IntegrationProvider
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        integration={integration({ productCardVersion: args.productCardVersion })}>
        <SortableList {...args} />
      </IntegrationProvider>
    );
  },
};
