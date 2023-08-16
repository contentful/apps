import type { Meta, StoryObj } from '@storybook/react';
import productPreviews from '../__mocks__/productPreviews';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logo from '../__mocks__/logo.svg';
import { SkuPicker } from './SkuPicker';
import { ProductsFn } from '../interfaces';
import { sdk } from '../__mocks__/storybook/sdk';
import { GlobalStyles } from '@contentful/f36-components';

const meta: Meta<typeof SkuPicker> = {
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
  return Promise.resolve({ pagination, products: productPreviews });
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
    fetchProductPreviews: () => Promise.resolve(productPreviews),
  },
};
