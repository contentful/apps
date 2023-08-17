import type { Meta, StoryObj } from '@storybook/react';
import { ProductList } from './index';
import { GlobalStyles } from '@contentful/f36-components';
import { productsList } from '../../__mocks__';

const meta: Meta<typeof ProductList> = {
  component: ProductList,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ProductList>;

export const Default: Story = {
  args: {
    products: productsList,
    selectedSKUs: [productsList[0].sku],
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
