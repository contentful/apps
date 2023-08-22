import type { Meta, StoryObj } from '@storybook/react';
import { columns } from '../../__mocks__/products';
import { MetaDataRenderer } from './MetaDataRenderer';

const meta: Meta<typeof MetaDataRenderer> = {
  title: 'AdditionalData/MetaDataRenderer',
  component: MetaDataRenderer,
  tags: ['autodocs'],
  parameters: {
    layout: 'left',
  },
};

export default meta;

type Story = StoryObj<typeof MetaDataRenderer>;

export const Default: Story = {
  args: {
    columns,
  },
};
