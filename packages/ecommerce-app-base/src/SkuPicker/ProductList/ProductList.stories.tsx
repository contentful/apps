import type { Meta, StoryObj } from '@storybook/react';
import { ProductList } from './index';
import productPreviews from '../../__mocks__/productPreviews';
import { GlobalStyles } from '@contentful/f36-components';

const meta: Meta<typeof ProductList> = {
  component: ProductList,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ProductList>;

export const Default: Story = {
  args: {
    products: productPreviews,
    selectedSKUs: [productPreviews[0].sku],
    selectProduct: (...args) => alert(args),
  },
  decorators: [
    (Story) => (
      <>
        <GlobalStyles />
        <Story />
      </>
    ),
  ],
};
