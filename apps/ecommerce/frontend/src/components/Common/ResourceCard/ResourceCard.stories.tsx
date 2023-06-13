import type { Meta, StoryObj } from '@storybook/react';
import ResourceCard from './ResourceCard';
import { ExternalResource } from 'types';
import { DragHandle } from '@contentful/f36-components';

const meta = {
  title: 'Ecom/ResourceCard',
  component: ResourceCard,
  tags: ['autodocs'],
} satisfies Meta<typeof ResourceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockExternalResource: ExternalResource = {
  name: 'Cheetos',
  description: 'Tasty and cheesy! These are so delicious and they make your fingers orange.',
  image:
    'https://images.ctfassets.net/juh8bvgveao4/QoAO8rqn86a4jiH1yudiN/e518fd9263b67705c3ffb041bd217bda/imageService.webp',
  status: 'new',
  id: 'Product ID: 1029384756',
};

export const FieldSingleReference: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    selectedResources: [],
    isLoading: false,
    index: 0,
    total: 1,
    showHeaderMenu: true,
  },
};

export const FieldMultipleReference: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    selectedResources: [],
    isLoading: false,
    index: 1,
    total: 4,
    dragHandleRender: () => {
      return <DragHandle label="Reorder Card" />;
    },
    showHeaderMenu: true,
  },
};

export const Dialog: Story = {
  args: {
    resource: mockExternalResource,
    cardHeader: 'Shopify Product',
    selectedResources: [],
    isLoading: false,
    index: 1,
    total: 4,
    showHeaderMenu: false,
  },
};
