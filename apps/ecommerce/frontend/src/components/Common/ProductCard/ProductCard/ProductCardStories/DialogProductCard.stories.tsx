import type { Meta, StoryObj } from '@storybook/react';
import ProductCard from '../ProductCard';
import { externalResource } from '../../../../../../.storybook/mocks/common';

const meta = {
  title: 'Ecommerce/ProductCard/DialogProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '700px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const designParams = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/g2qMc1SR37LoN36WzPo1T1/E-commerce-use-case?type=design&node-id=2306-40802&t=5CAVv5WZJvNiNDlK-0',
  },
};

export const DialogCard: Story = {
  args: {
    resource: externalResource,
    cardHeader: 'Shopify Product',
  },
  parameters: {
    ...designParams,
  },
};

export const DialogSelectedCard: Story = {
  args: {
    resource: externalResource,
    cardHeader: 'Shopify Product',
    isSelected: true,
  },
  parameters: {
    ...designParams,
  },
};

export const DialogLoadingCard: Story = {
  args: {
    resource: externalResource,
    cardHeader: 'Shopify Product',
    isLoading: true,
  },
  parameters: {
    ...designParams,
  },
};

export const DialogMissingCard: Story = {
  args: {
    resource: {},
    cardHeader: 'Shopify Product',
    externalResourceError: {
      error: 'error fetching external resource',
      errorMessage: 'Internal server error',
      errorStatus: 500,
    },
  },
  parameters: {
    ...designParams,
  },
};
