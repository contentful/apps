import type { Meta, StoryObj } from '@storybook/react';
import productPreviews from '../__mocks__/productPreviews';
import { SortableList } from './SortableList';
import { IntegrationProvider } from './IntegrationContext';
import { GlobalStyles } from '@contentful/f36-components';
import { SDKContext } from '@contentful/react-apps-toolkit';
import { sdk } from '../__mocks__/storybook/sdk';

const meta: Meta<typeof SortableList> = {
  component: SortableList,
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
