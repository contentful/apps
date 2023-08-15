import type { Meta, StoryObj } from '@storybook/react';
import { ProductSelectionList } from './index';
import productPreviews from '../../__mocks__/productPreviews';
import { GlobalStyles } from '@contentful/f36-components';

const meta: Meta<typeof ProductSelectionList> = {
  component: ProductSelectionList,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ProductSelectionList>;

export const Default: Story = {
  args: {
    products: productPreviews,
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
