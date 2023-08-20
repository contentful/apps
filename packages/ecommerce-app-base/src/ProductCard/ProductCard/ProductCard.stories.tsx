import type { StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';
import { DragHandle } from '@contentful/f36-components';
import { parameters } from '../../../.storybook/parameters';
import { products, productsList } from '../../__mocks__';

const CARD_HEADER = 'Shopify Product';
const CARD_TYPE = 'field';

const meta = {
  component: ProductCard,
  tags: ['autodocs'],
  ...parameters,
  argTypes: {
    resource: {
      options: products,
    },
  },
  args: {
    handleRemove: () => alert('remove item'),
    resource: productsList[0],
    title: CARD_HEADER,
    productCardType: CARD_TYPE,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const designParams = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/OoVDDeCreXbL8dc5GUuTDr/3rd-party-PIM?node-id=975%3A157640',
  },
};

export const SingleReference: Story = {
  args: {},
  parameters: {
    ...designParams,
  },
};

export const MultipleReference: Story = {
  args: {
    dragHandleRender: () => {
      return <DragHandle label="Reorder Card" />;
    },
  },
  parameters: {
    ...designParams,
  },
};

export const Selected: Story = {
  args: {
    isSelected: true,
  },
  parameters: {
    ...designParams,
  },
};

export const MissingProduct: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resource: {},
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

export const MissingImage: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resource: { ...productsList[0], image: 'not-resolvable' },
  },
  parameters: {
    ...designParams,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    ...designParams,
  },
};

// ToDo
export const CustomRenderer: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    ...designParams,
  },
};
