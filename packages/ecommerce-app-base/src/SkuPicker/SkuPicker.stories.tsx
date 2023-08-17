import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logo from '../__mocks__/logo.svg';
import { SkuPicker } from './SkuPicker';
import { ProductsFn } from '../types';
import { sdk } from '../__mocks__/storybook/sdk';
import { GlobalStyles } from '@contentful/f36-components';
import { productsList } from '../__mocks__';

const meta: Meta<typeof SkuPicker> = {
  title: 'SkuPicker/SkuPicker',
  component: SkuPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'left',
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

export default meta;

type Story = StoryObj<typeof SkuPicker>;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const fetchProducts: ProductsFn = (search, pagination) => {
  return Promise.resolve({ pagination, products: productsList });
};

export const Default: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    sdk,
    logo,
    fetchProducts,
    searchDelay: 500,
    hideSearch: false,
    skuType: 'product',
    fetchProductPreviews: () => Promise.resolve(productsList),
  },
};
