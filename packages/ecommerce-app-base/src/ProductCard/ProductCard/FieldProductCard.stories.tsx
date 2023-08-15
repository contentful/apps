import type { Meta, StoryObj } from '@storybook/react';
import ProductCard from './ProductCard';
import { DragHandle } from '@contentful/f36-components';
import { externalResource, externalResourceLink } from '../../__mocks__/storybook/common';

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

const CARD_HEADER = 'Shopify Product';
const CARD_TYPE = 'field';

export const FieldSingleReference: Story = {
  args: {
    resource: externalResource,
    cardHeader: CARD_HEADER,
    cardIndex: 0,
    totalCards: 1,
    productCardType: CARD_TYPE,
    externalResourceLink: externalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldMultipleReference: Story = {
  args: {
    resource: externalResource,
    cardHeader: CARD_HEADER,
    cardIndex: 1,
    totalCards: 4,
    dragHandleRender: () => {
      return <DragHandle label="Reorder Card" />;
    },
    productCardType: CARD_TYPE,
    externalResourceLink: externalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldSingleSelectedCard: Story = {
  args: {
    resource: externalResource,
    cardHeader: CARD_HEADER,
    cardIndex: 0,
    totalCards: 1,
    isSelected: true,
    productCardType: CARD_TYPE,
    externalResourceLink: externalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldSingleMissingCard: Story = {
  args: {
    resource: {},
    cardHeader: CARD_HEADER,
    cardIndex: 0,
    totalCards: 1,
    productCardType: CARD_TYPE,
    externalResourceError: {
      error: 'error fetching external resource',
      errorMessage: 'Internal server error',
      errorStatus: 500,
    },
    externalResourceLink: externalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};

export const FieldSingleSelectedCardLoading: Story = {
  args: {
    resource: externalResource,
    cardHeader: CARD_HEADER,
    cardIndex: 0,
    totalCards: 1,
    isLoading: true,
    productCardType: CARD_TYPE,
    externalResourceLink: externalResourceLink,
  },
  parameters: {
    ...designParams,
  },
};
