import type { Meta, StoryObj } from '@storybook/react';
import { ProductSelectionList } from './index';
import { productsList } from '../../__mocks__';

const meta: Meta<typeof ProductSelectionList> = {
  component: ProductSelectionList,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ProductSelectionList>;

const productPreviewNoImages = productsList.map((value) => {
  const product = { ...value, image: '' };
  return product;
});

export const Default: Story = {
  args: {
    products: productsList,
    selectProduct: (...args) => alert(args),
  },
};

export const NoImages: Story = {
  args: {
    products: productPreviewNoImages,
    selectProduct: (...args) => alert(args),
  },
};
