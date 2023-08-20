import type { Meta, StoryObj } from '@storybook/react';
import { products, productsList } from '../../__mocks__';
import { parameters } from '../../../.storybook/parameters';
import { LegacyProductCard } from './LegacyProductCard';

const meta: Meta<typeof LegacyProductCard> = {
  component: LegacyProductCard,
  tags: ['autodocs'],
  ...parameters,
  argTypes: {
    product: {
      options: products,
    },
  },
  args: {
    skuType: 'product',
    product: productsList[0],
    disabled: false,
    isSortable: false,
    onDelete: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof LegacyProductCard>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Sortable: Story = {
  args: {
    isSortable: true,
  },
};

export const MissingImage: Story = {
  args: {
    product: { ...productsList[0], image: '' },
  },
};

export const MissingProduct: Story = {
  args: {
    product: { ...productsList[0], name: undefined },
  },
};
