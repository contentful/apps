import type { Meta, StoryObj } from '@storybook/react';
import { parameters } from '../../../.storybook/parameters';
import { StoryFn } from '@storybook/react';
import { Container } from '../Container';
import { MetaData } from './MetaData';

const meta: Meta<typeof MetaData> = {
  title: 'AdditionalData/MetaData',
  component: MetaData,
  tags: ['autodocs'],
  ...parameters,
  parameters: {
    layout: 'left',
  },
  decorators: [
    (Story: StoryFn) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof MetaData>;

export const Default: Story = {
  args: {
    columns: [
      {
        title: 'Shopify activity',
        rows: [
          {
            name: 'Status',
            value: 'active',
          },
          {
            name: 'Inventory',
            value: '35 out of 40',
          },
          {
            name: 'Created',
            value: 'tbd',
          },
          {
            name: 'Updated',
            value: 'tbd',
          },
        ],
      },
      {
        title: 'Product information',
        rows: [
          {
            name: 'Price',
            value: '$20.00',
          },
          {
            name: 'Sizes',
            value: 'XL',
          },
          {
            name: 'Colors',
            value: 'Maroon and gold',
          },
          {
            name: 'Vendor',
            value: 'Surley',
          },
        ],
      },
    ],
  },
};
