import type { Meta, StoryObj } from '@storybook/react';
import { RawData } from './index';
import { decorators } from '../../__mocks__/storybook/decorators';

const meta: Meta<typeof RawData> = {
  title: 'AdditionalData/RawData',
  component: RawData,
  tags: ['autodocs'],
  decorators: [decorators.WithFixedWidth()],
};

export default meta;

type Story = StoryObj<typeof RawData>;

export const Default: Story = {
  args: {
    value: { hello: 'world' },
  },
};
