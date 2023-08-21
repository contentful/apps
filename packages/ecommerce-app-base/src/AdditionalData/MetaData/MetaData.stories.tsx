import type { Meta, StoryObj } from '@storybook/react';
import { columns } from '../../__mocks__/products';
import { MetaData } from './MetaData';

const meta: Meta<typeof MetaData> = {
  title: 'AdditionalData/MetaData',
  component: MetaData,
  tags: ['autodocs'],
  parameters: {
    layout: 'left',
  },
};

export default meta;

type Story = StoryObj<typeof MetaData>;

export const Default: Story = {
  args: {
    columns,
  },
};
