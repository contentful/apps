import type { Meta, StoryObj } from '@storybook/react';
import ProductCard from './ProductCard';
import { ExternalResource } from 'types';
import { DragHandle } from '@contentful/f36-components';

const meta = {
  title: 'Ecommerce/ProductCard',
  component: ProductCard,
  tags: ['autodocs'],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const designParams = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/g2qMc1SR37LoN36WzPo1T1/E-commerce-use-case?type=design&node-id=2306-40802&t=5CAVv5WZJvNiNDlK-0',
  },
};

const mockExternalResourceLink = {
  sys: {
    type: 'ResourceLink',
    linkType: 'Shopify:Product',
    urn: 'gid://shopify/Product/8191006998814',
  },
};

const mockExternalResource: ExternalResource = {
  name: 'Cheetos',
  description: 'Tasty and cheesy! These are so delicious and they make your fingers orange.',
  image:
    'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
  status: 'new',
  id: 'Product ID: 1029384756',
}; // use common mock>>>>>>>>>>>>>>>>>>>>>>

// stories of ProductCards of type Field

export const FieldSelectedCard: Story = {
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

export const FieldSingleReference: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    isLoading: false,
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
    isLoading: false,
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

// stories of ProductCards of type Dialog

export const DialogSelectedCard: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    isLoading: false,
    cardIndex: 0,
    totalCards: 1,
    isSelected: true,
  },
  parameters: {
    ...designParams,
  },
};

// NEED:
// Missing Resource state
// Missing Image state
// Product variant
// Product collection
