import type { Meta, StoryObj } from '@storybook/react';
import ProductCard from '../ProductCard';
import { DragHandle } from '@contentful/f36-components';
import { mockExternalResource, mockExternalResourceLink } from './mocks';

const meta = {
  title: 'Ecommerce/ProductCard/FieldProductCard',
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

export const FieldSingleReference: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    cardIndex: 0,
    totalCards: 1,
    productCardType: 'field',
    externalResourceLink: mockExternalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldMultipleReference: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    cardIndex: 1,
    totalCards: 4,
    dragHandleRender: () => {
      return <DragHandle label="Reorder Card" />;
    },
    productCardType: 'field',
    externalResourceLink: mockExternalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldSingleSelectedCard: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    cardIndex: 0,
    totalCards: 1,
    isSelected: true,
    productCardType: 'field',
    externalResourceLink: mockExternalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldSingleMissingCard: Story = {
  args: {
    resource: {},
    cardHeader: 'Shopify Product',
    cardIndex: 0,
    totalCards: 1,
    productCardType: 'field',
    error: {
      error: 'error fetching external resource',
      errorMessage: 'Internal server error',
      errorStatus: 500,
    },
    externalResourceLink: mockExternalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldSingleSelectedCardLoading: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    cardIndex: 0,
    totalCards: 1,
    isLoading: true,
    productCardType: 'field',
    externalResourceLink: mockExternalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};
