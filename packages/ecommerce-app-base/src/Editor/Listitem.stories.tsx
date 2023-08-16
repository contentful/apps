import type { Meta, StoryObj } from '@storybook/react';
import productPreviews from '../__mocks__/productPreviews';
import { parameters } from '../../.storybook/parameters';
import { ListItem } from './ListItem';

const meta: Meta<typeof ListItem> = {
  component: ListItem,
  tags: ['autodocs'],
  ...parameters,
  args: {
    skuType: 'product',
    product: productPreviews[0],
    disabled: false,
    isSortable: false,
    onDelete: () => {},
  },
};

export default meta;

type Story = StoryObj<typeof ListItem>;

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

export const NoImage: Story = {
  args: {
    product: { ...productPreviews[0], image: '' },
  },
};
