import type { StoryObj } from '@storybook/react';
import ProductCard from './ProductCard';
import { externalResource } from '../../__mocks__/storybook/common';
import { parameters } from '../../../.storybook/parameters';

const meta = {
  title: 'ProductCard/DialogProductCard',
  component: ProductCard,
  tags: ['autodocs'],
  ...parameters,
};

export default meta;
type Story = StoryObj<typeof meta>;

const designParams = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/g2qMc1SR37LoN36WzPo1T1/E-commerce-use-case?type=design&node-id=2306-40802&t=5CAVv5WZJvNiNDlK-0',
  },
};

export const Default: Story = {
  args: {
    resource: externalResource,
    cardHeader: 'Shopify Product',
  },
  parameters: {
    ...designParams,
  },
};

export const Selected: Story = {
  args: {
    resource: externalResource,
    cardHeader: 'Shopify Product',
    isSelected: true,
  },
  parameters: {
    ...designParams,
  },
};

export const Loading: Story = {
  args: {
    resource: externalResource,
    cardHeader: 'Shopify Product',
    isLoading: true,
  },
  parameters: {
    ...designParams,
  },
};

export const Missing: Story = {
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
