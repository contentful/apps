import type { Meta, StoryObj } from '@storybook/react';
import productPreviews from '../__mocks__/productPreviews';
import { SortableList } from './SortableList';
import { GlobalStyles } from '@contentful/f36-components';

const meta: Meta<typeof SortableList> = {
  component: SortableList,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SortableList>;

export const Default: Story = {
  args: {
    skuType: 'SKU Type',
    productPreviews,
    disabled: false,
    deleteFn: () => {},
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
